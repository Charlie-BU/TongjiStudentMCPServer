export type CourseDetailToolStatus = "ok" | "empty" | "upstream_unavailable";

export interface CourseReview {
    id: number | null;
    course_id: number | null;
    semester: string | null;
    rating: number | null;
    comment: string | null;
    score: string | null;
    created_at: number | null;
    approve_count: number | null;
    disapprove_count: number | null;
    is_hidden: number | null;
    reviewer_name: string | null;
    like_count: number | null;
}

export interface CourseDetailData {
    id: number | null;
    code: string | null;
    name: string | null;
    credit: number | null;
    department: string | null;
    teacher_id: number | null;
    review_count: number | null;
    review_avg: number | null;
    search_keywords: string | null;
    teacher_name: string | null;
    semesters: string[];
    reviews: CourseReview[];
}

export interface CourseDetailToolResult {
    [key: string]: unknown;
    status: CourseDetailToolStatus;
    data: CourseDetailData | null;
    source: "YourTJ";
}
