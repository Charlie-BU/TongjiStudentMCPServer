import { z } from "zod";

// COURSE_ID_INPUT_SCHEMA 定义课程记录标识。
export const COURSE_ID_INPUT_SCHEMA = z.object({
    courseId: z.number().int().positive().describe("课程记录 ID，来自课程搜索结果的 id。"),
}).strict();

// COURSE_SEARCH_INPUT_SCHEMA 定义课程搜索和页码分页参数。
export const COURSE_SEARCH_INPUT_SCHEMA = z.object({
    keyword: z.string().optional().describe("课程名称、代码或教师搜索关键词。"),
    instructor: z.array(z.string()).optional().describe("教师筛选，支持多个名称。"),
    department: z.array(z.string()).optional().describe("院系筛选，支持多个院系。"),
    term: z.array(z.string()).optional().describe("学期筛选，例如 2026-2027-1。"),
    campus: z.array(z.string()).optional().describe("校区筛选，支持多个校区。"),
    onlyWithReviews: z.literal(1).optional().describe("传 1 仅查询有评价的课程，不筛选时省略。"),
    sortBy: z.literal("rating").optional().describe("按评分排序；省略时采用上游默认排序。"),
    page: z.number().int().positive().default(1).describe("页码，从 1 开始。"),
    size: z.number().int().positive().default(20).describe("每页条数，默认 20。"),
}).strict();

// COURSE_REVIEW_INPUT_SCHEMA 定义评价筛选及游标分页参数。
export const COURSE_REVIEW_INPUT_SCHEMA = COURSE_ID_INPUT_SCHEMA.extend({
    offeringId: z.number().int().positive().optional().describe("开课记录 ID，来自课程详情 offerings；省略时查询课程全部评价。"),
    cursor: z.string().optional().describe("上一页的 nextCursor，原样传回；首页省略。"),
    pageSize: z.number().int().positive().default(20).describe("每页评价数，默认 20。"),
});

// COURSE_SUMMARY_INPUT_SCHEMA 定义已有总结查询参数。
export const COURSE_SUMMARY_INPUT_SCHEMA = COURSE_ID_INPUT_SCHEMA.extend({
    check: z.literal(true).default(true).describe("固定为 true，仅查询已有总结，不触发刷新生成。"),
});

// COURSE_BASE_SCHEMA 定义课程公共展示字段。
const COURSE_BASE_SCHEMA = z.object({
    id: z.number().int().describe("课程记录 ID。"),
    primaryCode: z.string().describe("主课程代码，保留前导零。"),
    name: z.string().describe("课程名称。"),
    department: z.string().optional().describe("开课院系，可能为空字符串。"),
    ratingAvg: z.number().optional().describe("课程平均评分，无评分时可能省略。"),
    reviewCount: z.number().int().optional().describe("评价数量，无评价时可能省略。"),
    teacherName: z.string().optional().describe("关联教师姓名，不代表全部开课教师。"),
});

// COURSE_SEARCH_ITEM_SCHEMA 定义课程搜索条目。
export const COURSE_SEARCH_ITEM_SCHEMA = COURSE_BASE_SCHEMA.extend({
    creditX10: z.number().int().optional().describe("学分乘以 10，例如 50 表示 5 学分。"),
    teacherId: z.number().int().optional().describe("关联教师 ID。"),
    aliases: z.array(z.string()).optional().describe("其他课程代码或别名。"),
    instructors: z.array(z.string()).optional().describe("关联开课教师列表。"),
    recentTerms: z.array(z.string()).optional().describe("最近开课学期列表。"),
});

// COURSE_SEARCH_DATA_SCHEMA 定义课程搜索分页结果。
export const COURSE_SEARCH_DATA_SCHEMA = z.object({
    list: z.array(COURSE_SEARCH_ITEM_SCHEMA).describe("当前页课程列表。"),
    page: z.number().int().positive().describe("当前页码。"),
    size: z.number().int().positive().describe("当前每页条数。"),
    total: z.number().int().nonnegative().describe("符合筛选条件的课程总数。"),
    hasNext: z.boolean().describe("是否存在下一页；为 true 时保持筛选条件并将 page 加一。"),
});

// COURSE_OFFERING_SCHEMA 定义课程开课记录。
export const COURSE_OFFERING_SCHEMA = z.object({
    id: z.number().int().describe("开课记录 ID，可作为评价查询的 offeringId。"),
    termCode: z.string().optional().describe("学期代码。"),
    termName: z.string().optional().describe("学期名称。"),
    campus: z.string().optional().describe("校区。"),
    faculty: z.string().optional().describe("开课院系。"),
    classCode: z.string().optional().describe("开课代码。"),
    className: z.string().optional().describe("班级名称。"),
    instructors: z.array(z.string()).optional().describe("该次开课的教师列表。"),
    ratingAvg: z.number().optional().describe("该次开课的平均评分。"),
    reviewCount: z.number().int().optional().describe("该次开课的评价数。"),
});

// COURSE_DETAIL_DATA_SCHEMA 定义不含评价正文的课程详情。
export const COURSE_DETAIL_DATA_SCHEMA = COURSE_BASE_SCHEMA.extend({
    creditX10: z.number().int().optional().describe("学分乘以 10，例如 50 表示 5 学分。"),
    teacherId: z.number().int().optional().describe("关联教师 ID。"),
    offerings: z.array(COURSE_OFFERING_SCHEMA).optional().describe("开课记录列表。"),
    ratingDistribution: z.array(z.number().int()).optional().describe("评分分布，当前上游为 1 至 5 星对应数量。"),
    reviewScope: z.string().optional().describe("评价聚合范围，例如 teacher；保留开放枚举。"),
});

// COURSE_REVIEW_SCHEMA 定义评价正文和公开展示信息。
export const COURSE_REVIEW_SCHEMA = z.object({
    id: z.number().int().describe("评价 ID，可用于去重。"),
    offeringId: z.number().int().optional().describe("关联开课记录 ID。"),
    rating: z.number().int().min(1).max(5).describe("评价星级，1 至 5。"),
    content: z.string().describe("评价原文，可能包含换行和 Markdown。"),
    contentHtml: z.string().optional().describe("评价 HTML 正文，展示时按不可信 HTML 处理。"),
    author: z.object({
        kind: z.string().optional().describe("作者类型，例如 legacy；保留开放枚举。"),
        label: z.string().optional().describe("作者公开展示标签。"),
    }).optional().describe("作者展示信息，仅返回已声明字段。"),
    viewer: z.object({
        canEdit: z.boolean().optional().describe("是否可编辑。"),
        canDelete: z.boolean().optional().describe("是否可删除。"),
        isHelpful: z.boolean().optional().describe("是否已标记有帮助。"),
        isDisliked: z.boolean().optional().describe("是否已点踩。"),
    }).optional().describe("当前访问者的权限和交互状态。"),
    helpfulCount: z.number().int().optional().describe("有帮助数量。"),
    dislikeCount: z.number().int().optional().describe("点踩数量。"),
    createdAt: z.string().optional().describe("创建时间，ISO 8601 字符串。"),
    updatedAt: z.string().optional().describe("更新时间，ISO 8601 字符串。"),
});

// COURSE_REVIEW_DATA_SCHEMA 定义评价游标分页结果。
export const COURSE_REVIEW_DATA_SCHEMA = z.object({
    list: z.array(COURSE_REVIEW_SCHEMA).describe("当前批次评价列表。"),
    total: z.number().int().nonnegative().describe("评价总数。"),
    nextCursor: z.string().optional().describe("下一页游标，缺失或为空表示结束。"),
});

// COURSE_SUMMARY_DATA_SCHEMA 定义已有 AI 总结和查询状态。
export const COURSE_SUMMARY_DATA_SCHEMA = z.object({
    status: z.string().describe("总结状态，例如 cached；其他上游状态原样保留。"),
    summary: z.object({
        consensus: z.string().optional().describe("推荐倾向，例如 recommend；保留开放枚举。"),
        keywords: z.array(z.string()).optional().describe("评价关键词。"),
        pros: z.array(z.string()).optional().describe("总结出的优点。"),
        cons: z.array(z.string()).optional().describe("总结出的缺点或注意事项。"),
        representativeReviews: z.array(z.unknown()).optional().describe("代表性评价；上游尚未声明元素结构。"),
    }).nullable().optional().describe("已有总结；不可用时可能缺失或为 null。"),
    generatedAt: z.string().optional().describe("生成时间，ISO 8601 字符串。"),
    model: z.string().optional().describe("生成模型标识。"),
});

// RELATED_COURSE_SCHEMA 定义关联课程摘要。
export const RELATED_COURSE_SCHEMA = COURSE_BASE_SCHEMA.extend({
    instructors: z.array(z.string()).optional().describe("开课教师列表。"),
    ratingCount: z.number().int().optional().describe("评分数量，与评价数量独立保留。"),
});

// COURSE_RELATED_DATA_SCHEMA 定义关联课程分组。
export const COURSE_RELATED_DATA_SCHEMA = z.object({
    teacherOtherCourses: z.array(RELATED_COURSE_SCHEMA).describe("相关教师的其他课程。"),
    sameCourseOtherTeachers: z.array(z.unknown()).optional().describe("同课程的其他教师记录，上游尚未声明元素结构。"),
    lineage: z.array(z.unknown()).optional().describe("课程关联信息，上游尚未声明元素结构。"),
});

// CourseSearchInput 表示课程搜索的手写适配器输入。
export type CourseSearchInput = z.input<typeof COURSE_SEARCH_INPUT_SCHEMA>;
// CourseReviewInput 表示评价查询的手写适配器输入。
export type CourseReviewInput = z.input<typeof COURSE_REVIEW_INPUT_SCHEMA>;
// CourseSummaryInput 表示已有总结查询的手写适配器输入。
export type CourseSummaryInput = z.input<typeof COURSE_SUMMARY_INPUT_SCHEMA>;
