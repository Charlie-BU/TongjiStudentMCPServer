import assert from "node:assert/strict";
import { request as sendRequest } from "node:http";
import type { AddressInfo } from "node:net";
import { after, it } from "node:test";
import axios from "axios";
import { createTestSqlite } from "../fixtures/sqlite";
import { testAuthConfig, TEST_API_KEY, SECOND_API_KEY } from "../fixtures/auth";
import { OAuthStore } from "../../src/oauth/store";
import { OAuthServer } from "../../src/oauth/server";
import { TOOL_POLICIES, TOOL_NAMES } from "../../src/auth/tool-policy";
import { withLuckinFake, success, smsData, tokenData, loginCookies } from "../fixtures/luckin";
const sqlite = createTestSqlite();
const database = require("../../src/storage/database") as typeof import("../../src/storage/database");
const databaseModule = require.cache[require.resolve("../../src/storage/database")]!;
databaseModule.exports = { ...database, openDatabase: () => sqlite.open() };
const { createHttpServer } = require("../../src/transport/http") as typeof import("../../src/transport/http");
const { readLuckinCredential, saveLuckinCredential } = require("../../src/storage/luckin-credentials") as typeof import("../../src/storage/luckin-credentials");
after(() => { databaseModule.exports = database; sqlite.close(); });
const withHttpServer = async (run: (url: string) => Promise<void>) => {
    const oauth = new OAuthServer(testAuthConfig, new OAuthStore(sqlite.oauthPath));
    const server = createHttpServer({ oauth });
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0,"127.0.0.1",resolve); });
    try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
    finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
};
const rpc = (url: string, method: string, params: unknown = {}, headers: Record<string,string> = { Authorization: `Bearer ${TEST_API_KEY}` }) => fetch(url + "/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({jsonrpc:"2.0",id:1,method,params}),
});
it("health remains public; malformed JSON and oversized authenticated bodies are rejected", async () => withHttpServer(async url => {
    assert.equal((await fetch(url + "/health")).status,200);
    assert.equal((await fetch(url + "/unknown")).status,404);
    const malformed = await fetch(url+"/mcp",{method:"POST",headers:{Authorization:`Bearer ${TEST_API_KEY}`},body:"{"});
    assert.equal(malformed.status,400);
    const oversized = await new Promise<number>((resolve,reject) => {
        const body="x".repeat(1_048_577);
        const req=sendRequest(url+"/mcp",{method:"POST",headers:{Authorization:`Bearer ${TEST_API_KEY}`,"content-length":Buffer.byteLength(body)}},res=>{res.resume();res.on("end",()=>resolve(res.statusCode!));});
        req.on("error",reject);req.end(body);
    });
    assert.equal(oversized,413);
}));
it("initialization and discovery require authentication and advertise OAuth on 401", async () => withHttpServer(async url => {
    for (const [method,params] of [["initialize",{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"test",version:"1"}}],["tools/list",{}]] as const) {
        const denied=await rpc(url,method,params,{"X-User-Id":"victim"});
        assert.equal(denied.status,401);
        assert.match(denied.headers.get("www-authenticate")!,/oauth-protected-resource\/mcp/);
        const accepted=await rpc(url,method,params);
        assert.equal(accepted.status,200);
        if(method==="tools/list") assert.match(await accepted.text(),/tongji.course.search/);
    }
}));
it("all campus tools reject external API-key identities before tool execution", async () => withHttpServer(async url => {
    for(const name of TOOL_POLICIES.tongji) {
        const denied=await rpc(url,"tools/call",{name,arguments:{}});
        assert.equal(denied.status,403,name);
        assert.equal((await denied.json() as {error:string}).error,"tongji_identity_required");
    }
}));
it("Tongji token is verified once per request; arbitrary upstream user ID is forwarded", async () => {
    const previous=axios.defaults.adapter;
    const users:string[]=[];
    axios.defaults.adapter=async config=>{
        users.push(config.params.userId);
        assert.equal(config.headers.Authorization,"Bearer service-token");
        return {data:{code:"A00000",data:config.params.userId==="00001"?{list:[{userId:"00001",name:"李建中",userTypeName:"教职工"}]}:[{balance:12}]},status:200,statusText:"OK",headers:{},config};
    };
    try{await withHttpServer(async url=>{
        const response=await rpc(url,"tools/call",{name:"tongji.user.card_balance",arguments:{}},{"X-Tongji-Access-Token":"service-token","X-User-Id":"student-a"});
        assert.equal(response.status,200);
        assert.match(await response.text(),/12/);
        assert.deepEqual(users,["00001","student-a"]);
    });}finally{axios.defaults.adapter=previous;}
});
it("invalid Tongji tokens never fall back to a valid API key, across all tools and protocol requests", async () => {
    const previous=axios.defaults.adapter;
    axios.defaults.adapter=async config=>({data:{code:"A99999",data:{list:[]}},status:200,statusText:"OK",headers:{},config});
    try{await withHttpServer(async url=>{
        const headers={Authorization:`Bearer ${TEST_API_KEY}`,"X-Tongji-Access-Token":"invalid","X-User-Id":"victim"};
        for(const name of TOOL_NAMES) {
            const response=await rpc(url,"tools/call",{name,arguments:{}},headers);
            assert.equal(response.status,403,name);await response.arrayBuffer();
        }
        for(const method of ["initialize","tools/list"]) {
            const response=await rpc(url,method,{},headers);assert.equal(response.status,403);await response.arrayBuffer();
        }
        const missing=await rpc(url,"tools/list",{}, {"X-Tongji-Access-Token":"invalid"});
        assert.equal(missing.status,401);assert.equal(missing.headers.get("www-authenticate"),null);
    });}finally{axios.defaults.adapter=previous;}
});
it("forged X-User-Id cannot select another user's saved Luckin credential", async () => {
    await saveLuckinCredential("victim",{...tokenData,luckyMcpToken:"victim-luckin-token"},true);
    await saveLuckinCredential(TEST_API_KEY,{...tokenData,luckyMcpToken:"own-luckin-token"},false);
    await withLuckinFake(async request=>{
        assert.ok(request.url?.includes("lkcoffee.com"));
        assert.equal(request.headers.Authorization,"Bearer own-luckin-token");
        return {data:{jsonrpc:"2.0",id:1,result:{content:[]}}};
    },async requests=>withHttpServer(async url=>{
        const params={name:"luckin.shop.search",arguments:{longitude:121,latitude:31}};
        const denied=await rpc(url,"tools/call",params,{"X-User-Id":"victim"});
        assert.equal(denied.status,401);assert.equal(requests.length,0);
        const accepted=await rpc(url,"tools/call",params,{Authorization:`Bearer ${TEST_API_KEY}`,"X-User-Id":"victim"});
        assert.equal(accepted.status,200);assert.doesNotMatch(await accepted.text(),/"isError":true/);assert.equal(requests.length,1);
        const other=await rpc(url,"tools/call",params,{Authorization:`Bearer ${SECOND_API_KEY}`,"X-User-Id":"victim"});
        assert.match(await other.text(),/尚未绑定/);assert.equal(requests.length,1);
    }));
});
it("external login saves only under verified Bearer identity, never the forged user ID", async () => {
    await withLuckinFake(async request=>{
        assert.ok(request.url?.includes("lkcoffee.com"));
        if(request.url?.endsWith("/validcode"))return {data:success(smsData,0)};
        if(request.url?.endsWith("/loginAi"))return {data:success({}),headers:{"set-cookie":loginCookies}};
        return {data:success(tokenData)};
    },async()=>withHttpServer(async url=>{
        const response=await rpc(url,"tools/call",{name:"luckin.auth.login",arguments:{mobile:"13800000000",validateCode:"012345"}},{Authorization:`Bearer ${SECOND_API_KEY}`,"X-User-Id":"victim"});
        assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/"isError":true/);
        assert.equal((await readLuckinCredential(SECOND_API_KEY))!.is_from_tongji,false);
        assert.equal((await readLuckinCredential("victim"))!.luckin_token,"victim-luckin-token");
    }));
});
it("legacy HTTP endpoint shares tool authentication instead of exposing a public bypass", async () => withHttpServer(async url=>{
    const path="/legacy/teacher-reviews?teacher="+encodeURIComponent("陈滨");
    assert.equal((await fetch(url+path)).status,401);
    const accepted=await fetch(url+path,{headers:{Authorization:`Bearer ${TEST_API_KEY}`}});
    assert.equal(accepted.status,200);assert.ok(Array.isArray(await accepted.json()));
    assert.equal((await fetch(url+"/legacy/teacher-reviews?teacher=A",{headers:{Authorization:`Bearer ${TEST_API_KEY}`}})).status,400);
}));
