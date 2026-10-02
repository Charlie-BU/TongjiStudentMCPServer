import assert from "node:assert/strict";
import { after, it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase, TEACHER_REVIEWS_SEED_PATH } from "../src/storage/database";

import { tokenData } from "./fixtures/luckin";

it("SQLite 初始化教师评价和瑞幸凭据表并保留后续数据", () => {
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
                ["user_id", "is_from_tongji", "luckin_token", "token_date", "token_timeout", "last_verified_at"]);
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


import { createTestSqlite } from "./fixtures/sqlite";
const sqlite = createTestSqlite();
const database = require("../src/storage/database") as typeof import("../src/storage/database");
const databaseModule = require.cache[require.resolve("../src/storage/database")]!;
databaseModule.exports = { ...database, openDatabase: () => sqlite.open() };
const { readLuckinCredential, saveLuckinCredential, markLuckinVerified } = require("../src/storage/luckin-credentials") as typeof import("../src/storage/luckin-credentials");
after(() => { databaseModule.exports = database; sqlite.close(); });

it("SQLite 凭据支持用户隔离、来源布尔值、替换、条件验证更新与参数化输入", async () => {
    const user = "a'; DROP TABLE user_luckin_credentials; --";
    await saveLuckinCredential(user, tokenData, true);
    await saveLuckinCredential("b", { ...tokenData, luckyMcpToken: "token-b" }, false);
    assert.equal(await readLuckinCredential("missing"), undefined);
    assert.equal((await readLuckinCredential(user))!.is_from_tongji, true);
    assert.equal((await readLuckinCredential("b"))!.is_from_tongji, false);
    assert.equal((await readLuckinCredential("b"))!.luckin_token, "token-b");
    assert.equal(await markLuckinVerified(user, tokenData.luckyMcpToken), true);
    assert.ok((await readLuckinCredential(user))!.last_verified_at);
    await saveLuckinCredential(user, { ...tokenData, luckyMcpToken: "replacement" }, false);
    assert.equal(await markLuckinVerified(user, tokenData.luckyMcpToken), false);
    assert.deepEqual(await readLuckinCredential(user), {
        user_id: user, is_from_tongji: false, luckin_token: "replacement", token_date: tokenData.luckyMcpTokenDate,
        token_timeout: tokenData.luckyMcpTokenTimeout, last_verified_at: null,
    });
    const db = sqlite.open();
    try {
        assert.equal(db.prepare("SELECT is_from_tongji FROM user_luckin_credentials WHERE user_id = ?").get(user)!.is_from_tongji, 0);
        assert.throws(() => db.prepare("UPDATE user_luckin_credentials SET is_from_tongji = 2").run());
    } finally { db.close(); }
});
