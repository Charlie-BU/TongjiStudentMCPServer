export type CourseRelatedToolStatus = "ok" | "empty" | "upstream_unavailable";

export interface RelatedCourseSummary {
    id: number | null;
    code: string | null;
    name: string | null;
    teacher_name: string | null;
    review_avg: number | null;
    review_count: number | null;
}

export interface CourseRelatedData {
    teacherOtherCourses: RelatedCourseSummary[];
    sameCourseOtherTeachers: RelatedCourseSummary[];
}

export interface CourseRelatedToolResult {
    [key: string]: unknown;
    status: CourseRelatedToolStatus;
    data: CourseRelatedData | null;
    source: "YourTJ";
}
