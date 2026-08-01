import axios, { type AxiosRequestConfig } from "axios";
import YourtjService from "./openapi/yourtj";

// DEFAULT_YOURTJ_BASE_URL 表示 YourTJ 服务的默认地址。
const DEFAULT_YOURTJ_BASE_URL = "https://jcourse.yourtj.de";
// DEFAULT_TIMEOUT_MS 表示 OpenAPI 请求的默认超时时间。
const DEFAULT_TIMEOUT_MS = 10_000;

// YourtjAdapterConfig 表示 YourTJ 服务适配器的配置。
interface YourtjAdapterConfig {
    baseUrl?: string;
    timeoutMs?: number;
}

// createYourtjAdapter 创建 YourTJ 服务的调用适配器。
export const createYourtjAdapter = (
    config: YourtjAdapterConfig = {},
): YourtjService<AxiosRequestConfig> => {
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    return new YourtjService<AxiosRequestConfig>({
        baseURL: config.baseUrl ?? DEFAULT_YOURTJ_BASE_URL,
        request: (requestConfig, options) =>
            axios
                .request({
                    ...requestConfig,
                    ...options,
                    timeout: options?.timeout ?? timeoutMs,
                })
                .then((response) => response.data),
    });
};

// getCourseDetail 查询课程详情。
export const getCourseDetail = async (
    id: number,
    config?: YourtjAdapterConfig,
): Promise<unknown> => {
    const adapter = createYourtjAdapter(config);
    return adapter.CourseDetailGET({ id });
};

// getCourseRelated 查询课程关联信息。
export const getCourseRelated = async (
    id: number,
    config?: YourtjAdapterConfig,
): Promise<unknown> => {
    const adapter = createYourtjAdapter(config);
    return adapter.CourseidRelatedGET({ id });
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

// getCourses 获取课程列表。
export const getCourses = async (
    config: YourtjAdapterConfig = {},
    page?: number,
    limit?: number,
    q?: string,
    includeTotal?: boolean,
): Promise<unknown> => {
    const service = createYourtjAdapter(config);
    return service.CoursesGET({ page, limit, q, includeTotal });
};

// getAllCalendars 获取所有学期列表。
export const getAllCalendars = async (
    config: YourtjAdapterConfig = {},
): Promise<unknown> => {
    const service = createYourtjAdapter(config);
    return service.GetAllCalendarGET();
};

// getGradesByCalendarId 获取当前学期所有年级。
export const getGradesByCalendarId = async (
    config: YourtjAdapterConfig = {},
    calendarId: number,
): Promise<unknown> => {
    const service = createYourtjAdapter(config);
    return service.FindGradeByCalendarIdPOST({ calendarId });
};
