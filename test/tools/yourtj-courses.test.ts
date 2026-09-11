import assert from "node:assert/strict";
import { describe, it } from "node:test";
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../src/server";
import { courseFixture, searchFixture, reviewsFixture, summaryFixture, relatedFixture } from "../fixtures/yourtj";

// withClient 创建隔离的 MCP 客户端和虚构上游响应。
const withClient = async (
    payload: unknown,
    run: (client: Client, requests: AxiosRequestConfig[]) => Promise<void>,
    httpStatus = 200,
) => {
    const previous = axios.defaults.adapter;
    const requests: AxiosRequestConfig[] = [];
    axios.defaults.adapter = async (config) => {
        requests.push(config);
        const response = { data: payload, status: httpStatus, statusText: "test", headers: {}, config };
        if (httpStatus !== 200) throw new AxiosError("test-secret", "ERR_BAD_RESPONSE", config, undefined, response);
        return response;
    };
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { accessToken: "test-token-not-for-yourtj" } });
    const client = new Client({ name: "test-yourtj-client", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        await run(client, requests);
    } finally {
        await client.close();
        await server.close();
        axios.defaults.adapter = previous;
    }
};

// cases 定义五个课程工具的公开契约样本。
const cases = [
    { name: "tongji.course.search", args: { keyword: "测试课程", campus: ["测试校区"] }, fixture: searchFixture,
        empty: { list: [], page: 1, size: 20, total: 0, hasNext: false } },
    { name: "tongji.course.course-detail", args: { courseId: 101 }, fixture: courseFixture, empty: undefined },
    { name: "tongji.course.course-related", args: { courseId: 101 }, fixture: relatedFixture,
        empty: { teacherOtherCourses: [], sameCourseOtherTeachers: [], lineage: [] } },
    { name: "tongji.course.reviews", args: { courseId: 101, offeringId: 301, cursor: "test-cursor", pageSize: 7 },
        fixture: reviewsFixture, empty: { list: [], total: 0 } },
    { name: "tongji.course.summary", args: { courseId: 101 }, fixture: summaryFixture,
        empty: { status: "pending", summary: null } },
];

describe("YourTJ 课程 MCP 契约", () => {
    it("应注册五个课程工具并公布完整的新输入和嵌套响应 schema", async () => {
        await withClient(undefined, async (client, requests) => {
            const { tools } = await client.listTools();
            for (const item of cases) {
                const tool = tools.find((tool) => tool.name === item.name);
                assert.ok(tool);
                assert.ok(tool.outputSchema);
                assert.equal(tool.annotations?.readOnlyHint, true);
            }
            const search = tools.find((t) => t.name === "tongji.course.search")!;
            assert.deepEqual(Object.keys(search.inputSchema.properties!).sort(),
                ["keyword", "instructor", "department", "term", "campus", "onlyWithReviews", "sortBy", "page", "size"].sort());
            assert.match(JSON.stringify(search.outputSchema), /hasNext/);
            assert.match(JSON.stringify(search.outputSchema), /creditX10/);
            assert.doesNotMatch(JSON.stringify(search.outputSchema), /review_count|teacher_name|semesters/);
            const detail = tools.find((t) => t.name === "tongji.course.course-detail")!;
            assert.deepEqual(detail.inputSchema.required, ["courseId"]);
            assert.match(JSON.stringify(detail.outputSchema), /offerings/);
            assert.doesNotMatch(JSON.stringify(detail.outputSchema), /reviewer_name|search_keywords|"reviews"/);
            assert.match(JSON.stringify(tools.find((t) => t.name === "tongji.course.reviews")!.outputSchema), /nextCursor/);
            assert.match(JSON.stringify(tools.find((t) => t.name === "tongji.course.summary")!.outputSchema), /representativeReviews/);
            assert.equal(requests.length, 0);
        });
    });

    for (const item of cases) {
        it(`${item.name} 应返回新契约字段且不传递账号凭证或额外响应字段`, async () => {
            const expected = item.fixture();
            await withClient({ code: 0, result: { ...expected, secret: "test-secret" } }, async (client, requests) => {
                const result = await client.callTool({ name: item.name, arguments: item.args });
                assert.notEqual(result.isError, true);
                assert.deepEqual(result.structuredContent, { status: "ok", data: expected, source: "YourTJ" });
                const content = result.content as Array<{ type: string; text: string }>;
                assert.deepEqual(JSON.parse(content[0].text), result.structuredContent);
                assert.equal(requests[0].headers?.Authorization, undefined);
                assert.equal(requests[0].headers?.Cookie, undefined);
                assert.doesNotMatch(JSON.stringify(result), /test-secret|test-token-not-for-yourtj/);
            });
        });

        if (item.empty) it(`${item.name} 应保留空结果的分页或状态字段`, async () => {
            await withClient({ code: 0, result: item.empty }, async (client) => {
                const result = await client.callTool({ name: item.name, arguments: item.args });
                assert.deepEqual(result.structuredContent, { status: "empty", data: item.empty, source: "YourTJ" });
            });
        });

        it(`${item.name} 应拒绝业务失败和不符合新契约的响应`, async () => {
            for (const payload of [{ code: 1, result: null, messageCode: "common.request.invalidParams", secret: "test-secret" },
                { code: 0, result: null }, { code: 0, result: {} }, { data: [] }]) {
                await withClient(payload, async (client) => {
                    const result = await client.callTool({ name: item.name, arguments: item.args });
                    assert.equal(result.isError, true);
                    assert.doesNotMatch(JSON.stringify(result), /test-secret|test-token-not-for-yourtj/);
                });
            }
        });

        it(`${item.name} 应将 HTTP 错误归一为公开服务错误`, async () => {
            for (const status of [400, 403, 404, 429, 500]) {
                await withClient({ secret: "test-secret" }, async (client) => {
                    const result = await client.callTool({ name: item.name, arguments: item.args });
                    assert.equal(result.isError, true);
                    assert.match(JSON.stringify(result), /upstream_unavailable/);
                    assert.doesNotMatch(JSON.stringify(result), /test-secret|重新完成授权/);
                }, status);
            }
        });
    }

    it("应拒绝旧参数、非法标识和刷新请求而不调用上游", async () => {
        await withClient(undefined, async (client, requests) => {
            for (const [name, args] of [
                ["tongji.course.search", { q: "旧搜索", limit: 10 }],
                ["tongji.course.search", { page: 0 }],
                ["tongji.course.search", { instructor: "应为数组" }],
                ["tongji.course.course-detail", { id: 101 }],
                ["tongji.course.course-related", { courseId: "101" }],
                ["tongji.course.reviews", { courseId: 101, offeringId: 0 }],
                ["tongji.course.reviews", { courseId: 101, pageSize: -1 }],
                ["tongji.course.summary", { courseId: 101, check: false }],
                ["tongji.course.summary", { courseId: 101, refresh: true }],
            ] as const) {
                const result = await client.callTool({ name, arguments: args });
                assert.equal(result.isError, true);
            }
            assert.equal(requests.length, 0);
        });
    });

    it("应裁剪已知嵌套对象的额外字段并保留新契约中的开放数组", async () => {
        const reviews = reviewsFixture();
        await withClient({ code: 0, result: { ...reviews, list: [{ ...reviews.list[0],
            author: { ...reviews.list[0].author, email: "test-secret" },
            viewer: { ...reviews.list[0].viewer, token: "test-secret" } }] } }, async (client) => {
            const result = await client.callTool({ name: "tongji.course.reviews", arguments: { courseId: 101 } });
            assert.notEqual(result.isError, true);
            assert.doesNotMatch(JSON.stringify(result), /test-secret/);
        });
        const related = { teacherOtherCourses: [], sameCourseOtherTeachers: [{ id: 102, extraPublicField: "test" }],
            lineage: [{ kind: "test-relation" }] };
        await withClient({ code: 0, result: related }, async (client) => {
            const result = await client.callTool({ name: "tongji.course.course-related", arguments: { courseId: 101 } });
            assert.deepEqual(result.structuredContent, { status: "ok", data: related, source: "YourTJ" });
        });
    });
});
