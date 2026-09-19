import assert from "node:assert/strict";
import { after, it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase, TEACHER_REVIEWS_SEED_PATH } from "../src/storage/database";

import { tokenData } from "./fixtures/luckin";

it("SQLite 仅初始化教师评价表并保留后续数据", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-storage-"));
    const path = join(dir, "mcp.sqlite");
    try {
        const seed = new DatabaseSync(TEACHER_REVIEWS_SEED_PATH, { readOnly: true });
        const expected = seed.prepare("SELECT * FROM teacher_reviews ORDER BY id").all();
        seed.close();
        assert.ok(expected.length > 0);
        const db = openDatabase(path);
        try {
            assert.deepEqual(db.prepare("SELECT * FROM teacher_reviews ORDER BY id").all(), expected);
            db.prepare("UPDATE teacher_reviews SET content = ? WHERE id = ?").run("本地更新评价", expected[0].id);
            db.prepare("INSERT INTO teacher_reviews (teacher, content) VALUES (?, ?)").run("测试教师", "测试评价");
            assert.deepEqual(db.prepare("PRAGMA table_info(user_luckin_credentials)").all().map(r => r.name),
                []);
            assert.equal(db.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok");
        } finally { db.close(); }
        const reopened = openDatabase(path);
        try {
            assert.equal(reopened.prepare("SELECT content FROM teacher_reviews WHERE teacher = ?").get("测试教师")!.content, "测试评价");
            assert.equal(reopened.prepare("SELECT content FROM teacher_reviews WHERE id = ?").get(expected[0].id)!.content, "本地更新评价");
            assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM teacher_reviews").get()!.n, expected.length + 1);
        }
        finally { reopened.close(); }
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

it("已有空评价表补齐种子数据", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-empty-storage-"));
    const path = join(dir, "mcp.sqlite");
    try {
        openDatabase(path).close();
        const db = new DatabaseSync(path);
        db.exec("DELETE FROM teacher_reviews");
        db.close();
        const reopened = openDatabase(path);
        try { assert.ok(Number(reopened.prepare("SELECT COUNT(*) AS n FROM teacher_reviews").get()!.n) > 0); }
        finally { reopened.close(); }

    } finally { rmSync(dir, { recursive: true, force: true }); }
});


import { createTestPostgres } from "./fixtures/postgres";
const pool = createTestPostgres();
const postgres = require("../src/storage/postgres") as typeof import("../src/storage/postgres");
const postgresModule = require.cache[require.resolve("../src/storage/postgres")]!;
postgresModule.exports = { ...postgres, getPostgresPool: () => pool };
const { readLuckinCredential, saveLuckinCredential, markLuckinVerified } = require("../src/storage/luckin-credentials") as typeof import("../src/storage/luckin-credentials");
after(async () => { postgresModule.exports = postgres; await pool.end(); });

it("PostgreSQL 凭据支持用户隔离、替换、条件验证更新与参数化输入", async () => {
    const user = "a'; DROP TABLE user_luckin_credentials; --";
    await saveLuckinCredential(user, tokenData);
    await saveLuckinCredential("b", { ...tokenData, luckyMcpToken: "token-b" });
    assert.equal(await readLuckinCredential("missing"), undefined);
    assert.equal((await readLuckinCredential("b"))!.luckin_token, "token-b");
    assert.equal(await markLuckinVerified(user, tokenData.luckyMcpToken), true);
    assert.ok((await readLuckinCredential(user))!.last_verified_at);
    await saveLuckinCredential(user, { ...tokenData, luckyMcpToken: "replacement" });
    assert.equal(await markLuckinVerified(user, tokenData.luckyMcpToken), false);
    assert.deepEqual(await readLuckinCredential(user), {
        user_id: user, luckin_token: "replacement", token_date: tokenData.luckyMcpTokenDate,
        token_timeout: tokenData.luckyMcpTokenTimeout, last_verified_at: null,
    });
});
