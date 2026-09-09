import assert from "node:assert/strict";
import { it } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { LEGACY_TEACHER_REVIEWS_DATABASE, searchLegacyTeacherReviews } from "../src/tools/legacy-teacher-reviews/query";
import { LEGACY_TEACHER_REVIEWS_TOOL_NAME } from "../src/tools/legacy-teacher-reviews";
import { createMcpServer } from "../src/server";

it("SQLite snapshot has exactly the requested table and columns", () => {
    const db = new DatabaseSync(LEGACY_TEACHER_REVIEWS_DATABASE, { readOnly: true });
    try {
        assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name), ["teacher_reviews"]);
        assert.deepEqual(db.prepare("PRAGMA table_info(teacher_reviews)").all().map(r => r.name), ["id", "teacher", "content"]);
        assert.equal(db.prepare("PRAGMA integrity_check").get()?.integrity_check, "ok");
    } finally { db.close(); }
});

it("returns all courses and reviews, preserves joint teaching and body-only attribution", () => {
    const reviews = searchLegacyTeacherReviews(" 陈滨 ");
    assert.ok(reviews.some(c => c.includes("高等数学 A 陈滨")));
    assert.ok(reviews.some(c => c.includes("数学分析陈滨")));
    assert.ok(searchLegacyTeacherReviews("黄美荣").some(c => searchLegacyTeacherReviews("李新贵").includes(c)));
    assert.ok(searchLegacyTeacherReviews("杨晓龙").some(c => c.includes("虚拟放射性核物理实验")));
    assert.ok(searchLegacyTeacherReviews("许洁").some(c => c.includes("绿色经济")));
    assert.ok(searchLegacyTeacherReviews("陈青文").some(c => c.includes("新媒体素养")));
    assert.ok(searchLegacyTeacherReviews("尹岚").some(c => c.includes("评价记录 50")));
    assert.ok(!searchLegacyTeacherReviews("沈利").some(c => c.includes("评价记录 50（")));
    assert.ok(searchLegacyTeacherReviews("郭婧").some(c => c.includes("某同学对二外选修类课程的小建议")));
    assert.ok(searchLegacyTeacherReviews("徐春阳").some(c => c.includes("嘉定体育场 1 号")));
});

it("matches name fragments across teachers and returns every item in stable order", () => {
    const db = new DatabaseSync(LEGACY_TEACHER_REVIEWS_DATABASE, { readOnly: true });
    try {
        const rows = db.prepare("SELECT teacher, content FROM teacher_reviews ORDER BY id").all();
        for (const fragment of ["陈", "晓", "滨"]) {
            const expected = rows.filter(row => String(row.teacher).includes(fragment));
            assert.ok(expected.length > 0);
            assert.deepEqual(searchLegacyTeacherReviews(` ${fragment} `), expected.map(row => row.content));
        }
        const chen = searchLegacyTeacherReviews("陈");
        assert.ok(searchLegacyTeacherReviews("陈滨").every(content => chen.includes(content)));
        assert.ok(searchLegacyTeacherReviews("陈青文").every(content => chen.includes(content)));
    } finally { db.close(); }
});

it("does not interpret SQL injection or wildcard input", () => {
    for (const name of ["不存在的老师", "%", "_", "' OR 1=1 --"]) {
        assert.deepEqual(searchLegacyTeacherReviews(name), []);
    }
    for (const name of ["", " \n ", "陈".repeat(101)]) {
        assert.throws(() => searchLegacyTeacherReviews(name));
    }
});

it("registers and invokes the legacy tool without credentials", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: {} });
    const client = new Client({ name: "legacy-test", version: "1" });
    try {
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        const listed = await client.listTools();
        assert.ok(listed.tools.some(t => t.name === LEGACY_TEACHER_REVIEWS_TOOL_NAME));
        const result = await client.callTool({ name: LEGACY_TEACHER_REVIEWS_TOOL_NAME, arguments: { teacher: "陈" } });
        assert.deepEqual(result.structuredContent, { content: searchLegacyTeacherReviews("陈") });
        const empty = await client.callTool({ name: LEGACY_TEACHER_REVIEWS_TOOL_NAME, arguments: { teacher: "不存在的老师" } });
        assert.deepEqual(empty.structuredContent, { content: [] });
        const invalid = await client.callTool({ name: LEGACY_TEACHER_REVIEWS_TOOL_NAME, arguments: { teacher: " " } });
        assert.equal(invalid.isError, true);
    } finally { await client.close(); await server.close(); }
});
