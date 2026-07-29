import { ToolStatus } from "../types";

// CourseScore 表示单门课程的成绩信息。
export interface CourseScore {
    courseCode: string | null;
    courseName: string | null;
    credit: number | null;
    gradePoint: number | null;
    isPass: number | null;
    isPassName: string | null;
    publicCoursesName: string | null;
    score: string | null;
    scoreName: string | null;
    updateTime: string | null;
    year: string | null;
}

// TermScore 表示单个学期的成绩汇总。
export interface TermScore {
    averagePoint: string | null;
    calName: string | null;
    creditInfo: CourseScore[];
    termName: string | null;
    termcode: string | null;
}

// UndergraduateScoreData 表示本科成绩的脱敏业务数据。
export interface UndergraduateScoreData {
    actualCredit: string | null;
    failingCourseCount: string | null;
    failingCredits: string | null;
    totalGradePoint: string | null;
    term: TermScore[];
}

// ScoreToolResult 表示本科生成绩查询的结构化结果。
export interface ScoreToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: UndergraduateScoreData;
    source: "Tongji Open Platform";
    calendarId?: string;
}
