import type { z } from "zod";
import type { COURSE_REVIEW_DATA_SCHEMA } from "../../../../integration/yourtj/contract";
import type { COURSE_REVIEWS_OUTPUT_SCHEMA } from "./index";

// CourseReviewsData 表示查询课程评价数据。
export type CourseReviewsData = z.infer<typeof COURSE_REVIEW_DATA_SCHEMA>;
// CourseReviewsToolResult 表示查询课程评价的结构化结果。
export type CourseReviewsToolResult = z.infer<typeof COURSE_REVIEWS_OUTPUT_SCHEMA>;
