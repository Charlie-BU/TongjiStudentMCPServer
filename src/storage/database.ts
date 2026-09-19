import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dataDirectory = resolve(__dirname, "../../data");
export const MCP_DATABASE_PATH = resolve(dataDirectory, "mcp.sqlite");
export const TEACHER_REVIEWS_SEED_PATH = resolve(dataDirectory, "teacher-reviews.seed.sqlite");

// 初始化空库时导入随代码发布的教师评价；已有评价和用户凭据保持不变。
export const openDatabase = (path = MCP_DATABASE_PATH): DatabaseSync => {
    mkdirSync(dirname(path), { recursive: true });
    const db = new DatabaseSync(path);
    try {
        db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
        // 串行化首次初始化，避免多个进程同时导入；失败时关闭连接回滚事务。
        db.exec("BEGIN IMMEDIATE");
        db.exec(`CREATE TABLE IF NOT EXISTS teacher_reviews (
            id INTEGER PRIMARY KEY,
            teacher TEXT NOT NULL,
            content TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS teacher_reviews_teacher ON teacher_reviews(teacher);
        CREATE TABLE IF NOT EXISTS user_luckin_credentials (
            user_id TEXT PRIMARY KEY NOT NULL,
            luckin_token TEXT NOT NULL,
            token_date INTEGER NOT NULL,
            token_timeout INTEGER NOT NULL,
            last_verified_at INTEGER
        )`);
        if (!db.prepare("SELECT 1 FROM teacher_reviews LIMIT 1").get()) {
            const seed = new DatabaseSync(TEACHER_REVIEWS_SEED_PATH, { readOnly: true });
            try {
                const insert = db.prepare("INSERT INTO teacher_reviews (id, teacher, content) VALUES (?, ?, ?)");
                for (const row of seed.prepare("SELECT id, teacher, content FROM teacher_reviews ORDER BY id").all()) {
                    insert.run(row.id, row.teacher, row.content);
                }
            } finally { seed.close(); }
        }
        db.exec("COMMIT");
        return db;
    } catch (error) { db.close(); throw error; }
};
