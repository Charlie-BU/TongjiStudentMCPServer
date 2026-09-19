import { MCP_DATABASE_PATH, openDatabase } from "../../../../storage/database";
import { z } from "zod";

export const legacyTeacherNameSchema = z.string().trim().min(2).max(100).refine(
    (name) => Array.from(name).length >= 2,
    "老师姓名或姓名片段至少需要两个字符。",
);
export const LEGACY_TEACHER_REVIEWS_PATH = "/legacy/teacher-reviews";
export const LEGACY_TEACHER_REVIEWS_DATABASE = MCP_DATABASE_PATH;

// Match literal name fragments; SQL wildcard characters remain ordinary input.
export const searchLegacyTeacherReviews = (teacher: string): string[] => {
    const name = legacyTeacherNameSchema.parse(teacher);
    const db = openDatabase();
    try {
        return db.prepare(
            "SELECT content FROM teacher_reviews WHERE instr(teacher, ?) > 0 ORDER BY id",
        ).all(name).map((row) => String(row.content));
    } finally {
        db.close();
    }
};
