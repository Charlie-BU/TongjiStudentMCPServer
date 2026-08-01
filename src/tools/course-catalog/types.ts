import { ToolStatus } from "../types";

// CourseCatalogItem 表示单条课程目录信息。
export interface CourseCatalogItem {
    code: string | null;
    name: string | null;
    rating: number | null;
    review_count: number | null;
    teacher_name: string | null;
    department: string | null;
    credit: number | null;
    semesters: string[];
}

// CourseCatalogData 表示课程目录查询的脱敏业务数据。
export interface CourseCatalogData {
    list: CourseCatalogItem[];
}

// CourseCatalogToolResult 表示课程目录查询的结构化结果。
export interface CourseCatalogToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: CourseCatalogData;
    source: "YourTJ";
    page?: number;
    limit?: number;
    q?: string;
}
