import axios, { type AxiosRequestConfig } from 'axios';
import YourtjService from './openapi/yourtj';

// DEFAULT_YOURTJ_BASE_URL 表示 YourTJ 服务的默认地址。
const DEFAULT_YOURTJ_BASE_URL = 'https://jcourse.yourtj.de';
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
