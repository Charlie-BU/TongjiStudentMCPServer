import assert from "node:assert/strict";
import { after, it } from "node:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { OAuthServer } from "../src/oauth/server";
import { OAuthStore } from "../src/oauth/store";
import { createHttpServer } from "../src/transport/http";
import { testAuthConfig, TEST_API_KEY } from "./fixtures/auth";
const directory=mkdtempSync(join(tmpdir(),"tongji-oauth-test-"));
after(()=>rmSync(directory,{recursive:true,force:true}));
let instance=0;
const withServer=async (run:(url:string,oauth:OAuthServer,advance:(seconds:number)=>void)=>Promise<void>,expiry=2592000)=>{
    let now=Date.now();
    const store=new OAuthStore(join(directory,`oauth-${instance++}.sqlite`),()=>now);
    const oauth=new OAuthServer({...testAuthConfig,accessTokenExpireSeconds:expiry},store,()=>now);
    const server=createHttpServer({oauth});
    await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
    try{await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`,oauth,seconds=>{now+=seconds*1000;});}
    finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
};
const register=async(url:string,method="none")=>{
    const response=await fetch(url+"/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({redirect_uris:["https://client.example/callback"],client_name:"<untrusted>",token_endpoint_auth_method:method,grant_types:["authorization_code","refresh_token"],response_types:["code"]})});
    assert.equal(response.status,201);return await response.json() as {client_id:string;client_secret?:string;grant_types:string[]};
};
const prepare=async(url:string,clientId:string,resource:string)=>{
    const verifier="v".repeat(64);
    const params=new URLSearchParams({client_id:clientId,redirect_uri:"https://client.example/callback",response_type:"code",code_challenge_method:"S256",code_challenge:createHash("sha256").update(verifier).digest("base64url"),state:"client-state",resource});
    const authorize=await fetch(url+"/authorize?"+params,{redirect:"manual"});
    assert.equal(authorize.status,302);
    const consent=await fetch(url+new URL(authorize.headers.get("location")!).pathname+new URL(authorize.headers.get("location")!).search);
    assert.equal(consent.status,200);
    const html=await consent.text();assert.match(html,/&lt;untrusted&gt;/);assert.doesNotMatch(html,/<untrusted>/);
    const request=html.match(/name="request" value="([^"]+)"/)![1];
    const csrf=html.match(/name="csrf" value="([^"]+)"/)![1];
    return{verifier,request,csrf,cookie:consent.headers.get("set-cookie")!.split(";")[0]};
};
const approve=async(url:string,p:Awaited<ReturnType<typeof prepare>>,key=TEST_API_KEY,extra:Record<string,string>={})=>fetch(url+"/oauth/consent",{
    method:"POST",redirect:"manual",headers:{"content-type":"application/x-www-form-urlencoded",cookie:p.cookie,...extra},body:new URLSearchParams({request:p.request,csrf:p.csrf,api_key:key,decision:"allow"}),
});
const redeem=async(url:string,client:{client_id:string;client_secret?:string},code:string,verifier:string,resource:string,extra:Record<string,string>={},headers:Record<string,string>={})=>fetch(url+"/token",{
    method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",...headers},body:new URLSearchParams({grant_type:"authorization_code",client_id:client.client_id,...(client.client_secret?{client_secret:client.client_secret}:{}),code,code_verifier:verifier,redirect_uri:"https://client.example/callback",resource,...extra}),
});
const authorizeCode=async(url:string,clientId:string,resource:string)=>{
    const p=await prepare(url,clientId,resource);
    const response=await approve(url,p);assert.equal(response.status,302);
    const redirect=new URL(response.headers.get("location")!);
    assert.equal(redirect.searchParams.get("state"),"client-state");assert.equal(redirect.searchParams.get("iss"),testAuthConfig.publicUrl);
    return{...p,code:redirect.searchParams.get("code")!};
};
it("OAuth discovery, consent, PKCE exchange, authenticated MCP, persistence, expiry and revocation",async()=>withServer(async(url,oauth,advance)=>{
    const discovery=await fetch(url+"/.well-known/oauth-protected-resource/mcp");
    assert.equal(discovery.status,200);assert.equal((await discovery.json() as {resource:string}).resource,oauth.resource);
    const metadata=await(await fetch(url+"/.well-known/oauth-authorization-server")).json() as {grant_types_supported:string[]};
    assert.deepEqual(metadata.grant_types_supported,["authorization_code"]);
    const client=await register(url);assert.deepEqual(client.grant_types,["authorization_code"]);
    const grant=await authorizeCode(url,client.client_id,oauth.resource);
    const response=await redeem(url,client,grant.code,grant.verifier,oauth.resource);
    assert.equal(response.status,200);
    const token=await response.json() as {access_token:string;expires_in:number;refresh_token?:string};
    assert.equal(token.expires_in,2592000);assert.equal(token.refresh_token,undefined);assert.notEqual(token.access_token,TEST_API_KEY);
    assert.equal(oauth.verifyAccessToken(token.access_token),true);
    const restart=new OAuthServer(oauth.config,new OAuthStore(oauth.store.path));
    assert.equal(restart.verifyAccessToken(token.access_token),true);
    const rpc=await fetch(url+"/mcp",{method:"POST",headers:{Authorization:`Bearer ${token.access_token}`,"content-type":"application/json",accept:"application/json, text/event-stream","X-User-Id":"forged-victim"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})});
    assert.equal(rpc.status,200);await rpc.arrayBuffer();
    const replay=await redeem(url,client,grant.code,grant.verifier,oauth.resource);assert.equal(replay.status,400);
    const refresh=await redeem(url,client,"unused",grant.verifier,oauth.resource,{grant_type:"refresh_token"});
    assert.equal((await refresh.json() as {error:string}).error,"unsupported_grant_type");
    const removedKey=new OAuthServer({...oauth.config,allowedApiKeys:[]},oauth.store);
    assert.equal(removedKey.verifyAccessToken(token.access_token),false);
    const bytes=readFileSync(oauth.store.path).toString("latin1");
    for(const secret of [TEST_API_KEY,token.access_token,grant.code,grant.csrf])assert.equal(bytes.includes(secret),false);
    assert.equal(statSync(oauth.store.path).mode&0o777,0o600);
    advance(2592000);assert.equal(oauth.verifyAccessToken(token.access_token),false);
    const expired=await fetch(url+"/mcp",{method:"POST",headers:{Authorization:`Bearer ${token.access_token}`},body:"{}"});assert.equal(expired.status,401);
    const next=await authorizeCode(url,client.client_id,oauth.resource);
    const newToken=await(await redeem(url,client,next.code,next.verifier,oauth.resource)).json() as {access_token:string};
    assert.notEqual(newToken.access_token,token.access_token);
    const revoked=await fetch(url+"/revoke",{method:"POST",body:new URLSearchParams({client_id:client.client_id,token:newToken.access_token})});
    assert.equal(revoked.status,200);assert.equal(oauth.verifyAccessToken(newToken.access_token),false);
}));
it("permanent access tokens omit expires_in, survive time passage, but remain revocable",async()=>withServer(async(url,oauth,advance)=>{
    const client=await register(url);const grant=await authorizeCode(url,client.client_id,oauth.resource);
    const token=await(await redeem(url,client,grant.code,grant.verifier,oauth.resource)).json() as {access_token:string;expires_in?:number};
    assert.equal(token.expires_in,undefined);advance(100*365*86400);assert.equal(oauth.verifyAccessToken(token.access_token),true);
    const removed=new OAuthServer({...oauth.config,allowedApiKeys:[]},oauth.store);assert.equal(removed.verifyAccessToken(token.access_token),false);
    await fetch(url+"/revoke",{method:"POST",body:new URLSearchParams({client_id:client.client_id,token:token.access_token})});
    assert.equal(oauth.verifyAccessToken(token.access_token),false);
},-1));
it("wrong key, CSRF, origin, client, callback, resource and PKCE cannot obtain a token",async()=>withServer(async(url,oauth,advance)=>{
    const client=await register(url);const p=await prepare(url,client.client_id,oauth.resource);
    assert.equal((await approve(url,p,"wrong-key")).status,401);
    assert.equal((await approve(url,p,TEST_API_KEY,{origin:"https://evil.example"})).status,403);
    assert.equal((await approve(url,{...p,csrf:"wrong"})).status,403);
    const approved=await approve(url,p);assert.equal(approved.status,302);
    assert.equal((await approve(url,p)).status,403);
    const code=new URL(approved.headers.get("location")!).searchParams.get("code")!;
    for(const [verifier,resource,extra] of [["x".repeat(64),oauth.resource,{}],[p.verifier,"https://other.example/mcp",{}],[p.verifier,oauth.resource,{redirect_uri:"https://evil.example/callback"}]] as [string,string,Record<string,string>][]) {
        assert.equal((await redeem(url,client,code,verifier,resource,extra)).status,400);
    }
    const other=await register(url);assert.equal((await redeem(url,other,code,p.verifier,oauth.resource)).status,400);
    const results=await Promise.all([redeem(url,client,code,p.verifier,oauth.resource),redeem(url,client,code,p.verifier,oauth.resource)]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
    const expired=await authorizeCode(url,client.client_id,oauth.resource);advance(121);
    assert.equal((await redeem(url,client,expired.code,expired.verifier,oauth.resource)).status,400);
    const invalid=await fetch(url+"/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({redirect_uris:["https://evil.example/callback#fragment"]})});assert.equal(invalid.status,400);
}));
it("confidential clients require their client secret; secrets are not persisted in plaintext",async()=>withServer(async(url,oauth)=>{
    for(const method of ["client_secret_post","client_secret_basic"]) {
        const client=await register(url,method);const grant=await authorizeCode(url,client.client_id,oauth.resource);
        const bad=await redeem(url,{...client,client_secret:"wrong"},grant.code,grant.verifier,oauth.resource);assert.equal(bad.status,401);
        const response=method==="client_secret_post"?await redeem(url,client,grant.code,grant.verifier,oauth.resource)
            :await redeem(url,{client_id:client.client_id},grant.code,grant.verifier,oauth.resource,{}, {Authorization:"Basic "+Buffer.from(client.client_id+":"+client.client_secret).toString("base64")});
        assert.equal(response.status,200);
        assert.equal(readFileSync(oauth.store.path).toString("latin1").includes(client.client_secret!),false);
    }
}));
