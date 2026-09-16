import type { z } from "zod";
import type { COURSE_SUMMARY_DATA_SCHEMA } from "../../../../integration/yourtj-contract";
import type { COURSE_SUMMARY_OUTPUT_SCHEMA } from "./index";

// CourseSummaryData 表示查询课程 AI 总结数据。
export type CourseSummaryData = z.infer<typeof COURSE_SUMMARY_DATA_SCHEMA>;
// CourseSummaryToolResult 表示查询课程 AI 总结的结构化结果。
export type CourseSummaryToolResult = z.infer<typeof COURSE_SUMMARY_OUTPUT_SCHEMA>;
