import axios, { type AxiosRequestConfig } from "axios";
import { z } from "zod";
import YourtjService from "./openapi/yourtj";
import {
    COURSE_ID_INPUT_SCHEMA, COURSE_SEARCH_INPUT_SCHEMA, COURSE_REVIEW_INPUT_SCHEMA,
    COURSE_SUMMARY_INPUT_SCHEMA, COURSE_SEARCH_DATA_SCHEMA, COURSE_DETAIL_DATA_SCHEMA,
    COURSE_REVIEW_DATA_SCHEMA, COURSE_SUMMARY_DATA_SCHEMA, COURSE_RELATED_DATA_SCHEMA,
    type CourseSearchInput, type CourseReviewInput, type CourseSummaryInput,
} from "./yourtj-contract";

// DEFAULT_YOURTJ_BASE_URL 表示公开课程论坛地址。
const DEFAULT_YOURTJ_BASE_URL = "https://f.yourtj.de";
// DEFAULT_ACADEMIC_BASE_URL 表示学期、年级和专业服务地址。
const DEFAULT_ACADEMIC_BASE_URL = "https://jcourse.yourtj.de";
// DEFAULT_TIMEOUT_MS 表示请求默认超时。
const DEFAULT_TIMEOUT_MS = 10_000;

// YourtjAdapterConfig 表示手写适配器配置。
export interface YourtjAdapterConfig {
    baseUrl?: string;
    timeoutMs?: number;
}

// resolveYourtjUrl 解析课程或教务接口的完整地址。
const resolveYourtjUrl = (path: string, config: YourtjAdapterConfig): string => {
    const base = config.baseUrl ?? (path.startsWith("/api/forum/")
        ? DEFAULT_YOURTJ_BASE_URL : DEFAULT_ACADEMIC_BASE_URL);
    return `${base.trim().replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

// createYourtjAdapter 创建 CAM 客户端的手写请求边界。
export const createYourtjAdapter = (
    config: YourtjAdapterConfig = {},
): YourtjService<AxiosRequestConfig> => new YourtjService<AxiosRequestConfig>({
    baseURL: (path) => resolveYourtjUrl(path, config),
    request: (requestConfig, options) => axios.request({
        ...requestConfig,
        ...options,
        headers: { Accept: "application/json", ...requestConfig.headers, ...options?.headers },
        paramsSerializer: { indexes: null },
        timeout: options?.timeout ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    }).then((response) => response.data),
});

// YourtjResponseError 表示已脱敏的上游业务或协议错误。
export class YourtjResponseError extends Error {
    constructor(public readonly reason: "invalidParams" | "business" | "malformed") {
        super(`YourTJ response: ${reason}`);
    }
}

// readCourseResult 校验业务状态并裁剪课程响应到手写契约。
const readCourseResult = <S extends z.ZodTypeAny>(response: unknown, schema: S): z.output<S> => {
    const envelope = z.object({
        code: z.number().int(),
        result: z.unknown(),
        messageCode: z.string().optional(),
    }).safeParse(response);
    if (!envelope.success) throw new YourtjResponseError("malformed");
    if (envelope.data.code !== 0) {
        throw new YourtjResponseError(envelope.data.messageCode === "common.request.invalidParams"
            ? "invalidParams" : "business");
    }
    const result = schema.safeParse(envelope.data.result);
    if (!result.success) throw new YourtjResponseError("malformed");
    return result.data;
};

// searchCourses 查询课程列表及页码分页信息。
export const searchCourses = async (input: CourseSearchInput = {}, config: YourtjAdapterConfig = {}) => {
    const request = COURSE_SEARCH_INPUT_SCHEMA.parse(input);
    const response = await createYourtjAdapter(config).CourseSearchGET(request);
    return readCourseResult(response, COURSE_SEARCH_DATA_SCHEMA);
};

// getCourseDetail 查询课程详情及开课记录。
export const getCourseDetail = async (courseId: number, config: YourtjAdapterConfig = {}) => {
    const request = COURSE_ID_INPUT_SCHEMA.parse({ courseId });
    const response = await createYourtjAdapter(config).CourseDetailGetGET(request);
    return readCourseResult(response, COURSE_DETAIL_DATA_SCHEMA);
};

// getCourseRelated 查询相关课程分组。
export const getCourseRelated = async (courseId: number, config: YourtjAdapterConfig = {}) => {
    const request = COURSE_ID_INPUT_SCHEMA.parse({ courseId });
    const response = await createYourtjAdapter(config).CourseRelatedListGET(request);
    return readCourseResult(response, COURSE_RELATED_DATA_SCHEMA);
};

// getCourseReviews 查询一页课程评价。
export const getCourseReviews = async (input: CourseReviewInput, config: YourtjAdapterConfig = {}) => {
    const request = COURSE_REVIEW_INPUT_SCHEMA.parse(input);
    const response = await createYourtjAdapter(config).CourseReviewListGET(request);
    return readCourseResult(response, COURSE_REVIEW_DATA_SCHEMA);
};

// getCourseSummary 查询已有 AI 总结。
export const getCourseSummary = async (input: CourseSummaryInput, config: YourtjAdapterConfig = {}) => {
    const request = COURSE_SUMMARY_INPUT_SCHEMA.parse(input);
    // CAM 暂缺总结 Path/Query 定义，使用客户端 options 补齐，生成文件保持只读。
    const response: unknown = await createYourtjAdapter(config).CourseSummaryGetGET(undefined, {
        url: resolveYourtjUrl(`/api/forum/courses/${request.courseId}/summary`, config),
        params: { check: request.check },
    });
    return readCourseResult(response, COURSE_SUMMARY_DATA_SCHEMA);
};

// getMajorsByGrade 按学期和年级查询专业列表。
export const getMajorsByGrade = async (
    calendarId: number,
    grade: number,
    config?: YourtjAdapterConfig,
): Promise<unknown> => {
    const adapter = createYourtjAdapter(config);
    return adapter.FindMajorByGradePOST({ calendarId, grade });
};

// getAllCalendars 获取所有学期列表。
export const getAllCalendars = async (
    config: YourtjAdapterConfig = {},
): Promise<unknown> => {
    const service = createYourtjAdapter(config);
    return service.GetAllCalendarGET();
};

