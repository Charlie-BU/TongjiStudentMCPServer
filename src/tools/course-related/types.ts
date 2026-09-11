import type { z } from "zod";
import type { COURSE_RELATED_DATA_SCHEMA } from "../../integration/yourtj-contract";
import type { COURSE_RELATED_OUTPUT_SCHEMA } from "./index";

// CourseRelatedData 表示查询课程关联数据。
export type CourseRelatedData = z.infer<typeof COURSE_RELATED_DATA_SCHEMA>;
// CourseRelatedToolResult 表示查询课程关联的结构化结果。
export type CourseRelatedToolResult = z.infer<typeof COURSE_RELATED_OUTPUT_SCHEMA>;
