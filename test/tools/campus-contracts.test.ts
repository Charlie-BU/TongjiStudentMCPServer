import assert from "node:assert/strict";
import { it } from "node:test";
import axios from "axios";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../src/server";
import { campusContracts } from "../fixtures/campus-contracts";
import type { ToolInvocationContext } from "../../src/transport/invocation-context";

const withClient = async (invocation: ToolInvocationContext, run: (client: Client) => Promise<void>) => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation });
    const client = new Client({ name: "campus-contract-test", version: "1" });
    try { await server.connect(serverTransport); await client.connect(clientTransport); await run(client); }
    finally { await client.close(); await server.close(); }
};
const identity = { accessToken: "service-token", userId: "student-a" };
const clean = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([,v]) => v !== undefined));

for (const contract of campusContracts) {
    it(`${contract.name}: CAM wire contract, hidden identity, and strict model arguments`, async () => {
        const previous = axios.defaults.adapter;
        let calls = 0;
        axios.defaults.adapter = async request => {
            calls++;
            assert.equal(request.url, "https://api.tongji.edu.cn" + contract.path);
            assert.equal(request.method, contract.method);
            assert.equal(request.headers.Authorization, "Bearer service-token");
            const params = contract.method === "post" ? JSON.parse(request.data) : clean(request.params ?? {});
            assert.deepEqual(params, { ...contract.args, ...(contract.scoped ? { userId: "student-a" } : {}) });
            return { data: {code:"A00000",data:contract.data},status:200,statusText:"OK",headers:{},config:request };
        };
        try { await withClient(identity, async client => {
            const result = await client.callTool({name:contract.name,arguments:contract.args});
            assert.notEqual(result.isError,true,JSON.stringify(result));
            for (const forbidden of ["userId", "accessToken", "Authorization"]) {
                const invalid = await client.callTool({name:contract.name,arguments:{...contract.args,[forbidden]:"forged"}});
                assert.equal(invalid.isError,true);
            }
            assert.equal(calls,1);
            assert.doesNotMatch(JSON.stringify(result),/service-token|student-a/);
        }); } finally { axios.defaults.adapter = previous; }
    });
}

it("all registered model input schemas exclude service credentials and user identity", async () => withClient(identity, async client => {
    const {tools} = await client.listTools();
    assert.equal(tools.filter(tool => tool.name.startsWith("tongji.")).length,49); // 43 campus APIs + 6 independent course tools
    for (const name of ["tongji.student.online_courses", "tongji.meeting.create", "tongji.course.calendar_list", "tongji.card.current_flow", "tongji.calendar.days", "tongji.postgraduate.lecture_progress", "tongji.student.basic_info", "tongji.user.profile", "tongji.user.basic_info"]) {
        assert.equal(tools.some(tool => tool.name === name), false, name);
    }
    for (const tool of tools) {
        for (const key of ["userId","accessToken","access_token","Authorization","client_secret"])
            assert.equal(Object.hasOwn(tool.inputSchema.properties ?? {},key),false,tool.name+":"+key);
    }
    for (const name of ["tongji.user.update_contact_info"]) {
        const tool = tools.find(item=>item.name===name)!;
        assert.equal(tool.annotations?.readOnlyHint,false);
        assert.equal(tool.annotations?.idempotentHint,false);
    }
}));

it("missing or ambiguous identity never reaches a privileged API", async () => {
    const previous = axios.defaults.adapter;
    let calls=0;
    axios.defaults.adapter=async()=>{calls++;throw new Error("must not call")};
    try {
        for (const invocation of [{accessToken:"service-token"},{userId:"student-a"},{...identity,userId:"a,b"},{}]) {
            await withClient(invocation,async client=>{
                for (const name of ["tongji.card.balance","tongji.student.score","luckin.auth.check"]) {
                    assert.equal((await client.callTool({name,arguments:{}})).isError,true);
                }
            });
        }
        assert.equal(calls,0);
    } finally {axios.defaults.adapter=previous;}
});

it("business validation rejects incomplete writes and invalid summary parameters",async()=>{
    const previous=axios.defaults.adapter;
    let calls=0;
    axios.defaults.adapter=async()=>{calls++;throw new Error("must not call")};
    try {await withClient(identity,async client=>{
        for(const [name,args] of [
            ["tongji.user.update_contact_info",{}],
            ["tongji.card.spending_summary",{cycle:"week"}],
            ["tongji.student.final_exams",{}],
        ] as [string,Record<string,unknown>][]) assert.equal((await client.callTool({name,arguments:args})).isError,true);
    });assert.equal(calls,0);}finally{axios.defaults.adapter=previous;}
});

it("strips unknown fields and credentials; upstream business errors and write timeouts do not retry",async()=>{
 const previous=axios.defaults.adapter;
 let calls=0;
 let mode="data";
 axios.defaults.adapter=async request=>{
  calls++;
  if(mode==="timeout")throw new Error("private-service-token");
  return {data:{code:mode==="error"?"A99999":"A00000",data:[{balance:12.5,userId:"student-a",access_token:"service-token",unknown:"private"}]},status:200,statusText:"OK",headers:{},config:request};
 };
 try{await withClient(identity,async client=>{
  const data=await client.callTool({name:"tongji.card.balance",arguments:{}});
  assert.deepEqual(data.structuredContent,{status:"ok",data:[{balance:12.5}],source:"Tongji Open Platform"});
  mode="error";
  assert.equal((await client.callTool({name:"tongji.card.balance",arguments:{}})).isError,true);
  mode="timeout";
  const result=await client.callTool({name:"tongji.user.update_contact_info",arguments:{email:"a@example.test"}});
  assert.equal(result.isError,true);
  assert.doesNotMatch(JSON.stringify(result),/private-service-token/);
  assert.equal(calls,3);
 });}finally{axios.defaults.adapter=previous;}
});

it("concurrent calls keep each user's identity with the shared service credential",async()=>{
 const previous=axios.defaults.adapter;
 const users:string[]=[];
 axios.defaults.adapter=async config=>{users.push(config.params.userId);assert.equal(config.headers.Authorization,"Bearer service-token");return{data:{code:"A00000",data:[]},status:200,statusText:"OK",headers:{},config}};
 try{
  await Promise.all(["student-a","student-b"].map(userId=>withClient({...identity,userId},async client=>{assert.notEqual((await client.callTool({name:"tongji.card.balance",arguments:{}})).isError,true)})));
  assert.deepEqual(users.sort(),["student-a","student-b"]);
 }finally{axios.defaults.adapter=previous;}
});

it("real-time access records use current CAM fields and return the next cursor",async()=>{
 const previous=axios.defaults.adapter;
 const seen:Record<string,unknown>[]=[];
 axios.defaults.adapter=async config=>{
  seen.push(clean(config.params));
  const school=config.url?.endsWith("campus_access_control");
  return {data:{code:"A00000",data:{count:1,userInfos:school?[{cardRecordID:42,recordTime:"2026-09-23 10:00:00",portNum:1}]:[{visitNo:"v42",visitTime:"2026-09-23 11:00:00",direction:2}]}},status:200,statusText:"OK",headers:{},config};
 };
 try{await withClient(identity,async client=>{
  const school=await client.callTool({name:"tongji.student.school_access",arguments:{portNum:"1",sinceCardRecordID:"41"}});
  assert.equal(school.isError,undefined);
  assert.equal((school.structuredContent as Record<string, unknown>)?.sinceCardRecordID,"42");
  assert.match(JSON.stringify(school),/2026-09-23 10:00:00/);
  const library=await client.callTool({name:"tongji.student.library_access",arguments:{direction:"2",dataStartTime:"2026-09-01 00:00:00",sinceVisitNo:"v41"}});
  assert.equal(library.isError,undefined);
  assert.equal((library.structuredContent as Record<string, unknown>)?.sinceVisitNo,"v42");
  assert.deepEqual(seen,[{userId:"student-a",portNum:"1",sinceCardRecordID:"41"},{userId:"student-a",direction:"2",dataStartTime:"2026-09-01 00:00:00",sinceVisitNo:"v41"}]);
 });}finally{axios.defaults.adapter=previous;}
});

it("v2 pagination cannot change the trusted user scope",async()=>{
 const previous=axios.defaults.adapter;
 axios.defaults.adapter=async config=>{
  assert.deepEqual(clean(config.params),{userId:"student-a",sinceWid:"cursor-a",sinceUpdateTime:"2026-09-01"});
  return {data:{code:"A00000",data:{list:[],sinceWid:"cursor-b"}},status:200,statusText:"OK",headers:{},config};
 };
 try{await withClient(identity,async client=>{
  const result=await client.callTool({name:"tongji.student.scholarship_info",arguments:{sinceWid:"cursor-a",sinceUpdateTime:"2026-09-01"}});
  assert.equal(result.isError,undefined);
  assert.deepEqual((result.structuredContent as Record<string, unknown>)?.pagination,{sinceWid:"cursor-b"});
 });}finally{axios.defaults.adapter=previous;}
});

it("all 43 campus tools share authentication and operation annotations", async () => {
    const previous = axios.defaults.adapter;
    let calls = 0;
    axios.defaults.adapter = async () => { calls++; throw new Error("anonymous calls must not reach upstream"); };
    try {
        await withClient({}, async client => {
            const { tools } = await client.listTools();
            const campus = tools.filter(tool => tool.name.startsWith("tongji.") && !tool.name.startsWith("tongji.course."));
            assert.equal(campus.length, 43);
            for (const tool of campus) {
                const write = tool.name === "tongji.user.update_contact_info";
                assert.equal(tool.annotations?.readOnlyHint, !write, tool.name);
                assert.equal(tool.annotations?.idempotentHint, !write, tool.name);
                const args = campusContracts.find(item => item.name === tool.name)?.args
                    ?? (tool.name === "tongji.student.annual_bill" ? { year: "2024" } : {});
                const result = await client.callTool({ name: tool.name, arguments: args });
                assert.equal(result.isError, true, tool.name);
                assert.match(JSON.stringify(result.content), /unauthorized/, tool.name);
            }
        });
        assert.equal(calls, 0);
    } finally { axios.defaults.adapter = previous; }
});

it("mapped campus responses redact service tokens while retaining business fields", async () => {
    const previous = axios.defaults.adapter;
    axios.defaults.adapter = async config => ({
        data: { code: "A00000", data: [{ title: "book service-token", internal: "private", Authorization: "service-token" }] },
        status: 200, statusText: "OK", headers: {}, config,
    });
    try {
        await withClient(identity, async client => {
            const result = await client.callTool({ name: "tongji.student.book-lend-info", arguments: {} });
            assert.notEqual(result.isError, true);
            assert.doesNotMatch(JSON.stringify(result), /service-token|private|Authorization/);
            assert.match(JSON.stringify(result), /\[redacted\]/);
        });
    } finally { axios.defaults.adapter = previous; }
});

it("contact updates require confirmed business success and never retry uncertain results", async () => {
    const previous = axios.defaults.adapter;
    const cases = [
        { code: "A99999", effectRows: 0 },
        { code: "A99999", effectRows: 1 },
        { code: "A00000", effectRows: 0 },
        { code: "A00000", effectRows: -1 },
        { code: "A00000", effectRows: 0.5 },
        { code: "A00000", effectRows: "1" },
        { code: "A00000" },
        { effectRows: 1 },
        {}, null,
    ];
    let data: unknown;
    let calls = 0;
    axios.defaults.adapter = async config => {
        calls++;
        return { data: { code: "A00000", data }, status: 200, statusText: "OK", headers: {}, config };
    };
    try {
        await withClient(identity, async client => {
            for (const item of cases) {
                data = item;
                const before = calls;
                const result = await client.callTool({ name: "tongji.user.update_contact_info", arguments: { email: "a@example.test" } });
                assert.equal(result.isError, true, JSON.stringify(item));
                assert.match(JSON.stringify(result.content), /先核实结果.*不要自动重试/);
                assert.equal(calls, before + 1);
                assert.equal(result.structuredContent, undefined);
            }
            data = { code: "A00000", effectRows: 1, logTrace: "private-trace" };
            const result = await client.callTool({ name: "tongji.user.update_contact_info", arguments: { phone: "13800000000" } });
            assert.notEqual(result.isError, true);
            assert.deepEqual(result.structuredContent, {
                status: "ok", data: { code: "A00000", effectRows: 1 }, source: "Tongji Open Platform",
            });
            assert.doesNotMatch(JSON.stringify(result), /private-trace/);
            assert.equal(calls, cases.length + 1);
        });
    } finally { axios.defaults.adapter = previous; }
});
