import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";

export const legacyTeacherNameSchema = z.string().trim().min(1).max(100);
export const LEGACY_TEACHER_REVIEWS_PATH = "/legacy/teacher-reviews";
// Resolve relative to src/tools/legacy-teacher-reviews or dist/tools/legacy-teacher-reviews, independently of process.cwd().
export const LEGACY_TEACHER_REVIEWS_DATABASE = resolve(
    __dirname, "../../../data/legacy-teacher-reviews.sqlite",
);

// Exact name matching prevents mixing different teachers or treating SQL wildcards as names.
export const searchLegacyTeacherReviews = (teacher: string): string[] => {
    const name = legacyTeacherNameSchema.parse(teacher);
    const db = new DatabaseSync(LEGACY_TEACHER_REVIEWS_DATABASE, { readOnly: true });
    try {
        return db.prepare(
            "SELECT content FROM teacher_reviews WHERE teacher = ? ORDER BY id",
        ).all(name).map((row) => String(row.content));
    } finally {
        db.close();
    }
};
