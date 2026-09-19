import assert from "node:assert/strict";
import { it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openDatabase, TEACHER_REVIEWS_SEED_PATH } from "../src/storage/database";
import { readLuckinCredential, saveLuckinCredential, markLuckinVerified } from "../src/storage/luckin-credentials";
import { tokenData } from "./fixtures/luckin";

it("新库导入完整教师评价并保留后续数据，五字段表支持隔离、重启读取、替换和条件更新时间", () => {
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
                ["user_id", "luckin_token", "token_date", "token_timeout", "last_verified_at"]);
            assert.equal(db.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok");
        } finally { db.close(); }
        const reopened = openDatabase(path);
        try {
            assert.equal(reopened.prepare("SELECT content FROM teacher_reviews WHERE teacher = ?").get("测试教师")!.content, "测试评价");
            assert.equal(reopened.prepare("SELECT content FROM teacher_reviews WHERE id = ?").get(expected[0].id)!.content, "本地更新评价");
            assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM teacher_reviews").get()!.n, expected.length + 1);
        }
        finally { reopened.close(); }
        saveLuckinCredential("a", tokenData, path);
        saveLuckinCredential("b", { ...tokenData, luckyMcpToken: "token-b" }, path);
        assert.equal(readLuckinCredential("missing", path), undefined);
        assert.equal(readLuckinCredential("b", path)!.luckin_token, "token-b");
        assert.equal(markLuckinVerified("a", tokenData.luckyMcpToken, path), true);
        assert.ok(readLuckinCredential("a", path)!.last_verified_at);
        saveLuckinCredential("a", { ...tokenData, luckyMcpToken: "replacement" }, path);
        assert.equal(markLuckinVerified("a", tokenData.luckyMcpToken, path), false);
        assert.equal(readLuckinCredential("a", path)!.last_verified_at, null);
        assert.equal(readLuckinCredential("a", path)!.luckin_token, "replacement");
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

it("已有空评价表补齐种子数据且保留凭据", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-empty-storage-"));
    const path = join(dir, "mcp.sqlite");
    try {
        saveLuckinCredential("existing-user", tokenData, path);
        const db = new DatabaseSync(path);
        db.exec("DELETE FROM teacher_reviews");
        db.close();
        const reopened = openDatabase(path);
        try { assert.ok(Number(reopened.prepare("SELECT COUNT(*) AS n FROM teacher_reviews").get()!.n) > 0); }
        finally { reopened.close(); }
        assert.equal(readLuckinCredential("existing-user", path)!.luckin_token, tokenData.luckyMcpToken);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
