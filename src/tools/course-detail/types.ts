import type { z } from "zod";
import type { COURSE_DETAIL_DATA_SCHEMA } from "../../integration/yourtj-contract";
import type { COURSE_DETAIL_OUTPUT_SCHEMA } from "./index";

// CourseDetailData 表示查询课程详情数据。
export type CourseDetailData = z.infer<typeof COURSE_DETAIL_DATA_SCHEMA>;
// CourseDetailToolResult 表示查询课程详情的结构化结果。
export type CourseDetailToolResult = z.infer<typeof COURSE_DETAIL_OUTPUT_SCHEMA>;
