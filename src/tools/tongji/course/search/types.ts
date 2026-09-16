import type { z } from "zod";
import type { COURSE_SEARCH_DATA_SCHEMA } from "../../../../integration/yourtj-contract";
import type { COURSE_CATALOG_OUTPUT_SCHEMA } from "./index";

// CourseCatalogData 表示查询课程目录数据。
export type CourseCatalogData = z.infer<typeof COURSE_SEARCH_DATA_SCHEMA>;
// CourseCatalogToolResult 表示查询课程目录的结构化结果。
export type CourseCatalogToolResult = z.infer<typeof COURSE_CATALOG_OUTPUT_SCHEMA>;
