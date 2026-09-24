import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Fixed runtime directory, separate from the read-only seed shipped in seed/.
const dataDirectory = resolve(__dirname, "../../data");
export const MCP_DATABASE_PATH = resolve(dataDirectory, "mcp.sqlite");
export const TEACHER_REVIEWS_SEED_PATH = resolve(__dirname, "../../seed/teacher-reviews.seed.sqlite");

// 初始化空库时导入随代码发布的教师评价；已有评价保持不变。
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
        CREATE INDEX IF NOT EXISTS teacher_reviews_teacher ON teacher_reviews(teacher)`);

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
