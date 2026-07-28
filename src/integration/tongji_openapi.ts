import axios, { type AxiosRequestConfig } from 'axios';
import TongjiOpenapiService from './openapi/tongji_openapi';

// DEFAULT_TONGJI_OPENAPI_BASE_URL 表示同济开放平台的默认地址。
const DEFAULT_TONGJI_OPENAPI_BASE_URL = 'https://api.tongji.edu.cn';
// DEFAULT_TIMEOUT_MS 表示 OpenAPI 请求的默认超时时间。
const DEFAULT_TIMEOUT_MS = 10_000;

// TongjiOpenapiAdapterConfig 表示同济开放平台适配器的配置。
export interface TongjiOpenapiAdapterConfig {
  accessToken: string;
  baseUrl?: string;
  timeoutMs?: number;
}

// TongjiOpenapiAdapter 表示同济开放平台的调用适配器。
export interface TongjiOpenapiAdapter {
  service: TongjiOpenapiService<AxiosRequestConfig>;
  withAuthorization: <T extends Record<string, unknown>>(
    request: T,
  ) => T & { Authorization: string };
}

// createTongjiOpenapiAdapter 创建同济开放平台的调用适配器。
export const createTongjiOpenapiAdapter = (
  config: TongjiOpenapiAdapterConfig,
): TongjiOpenapiAdapter => {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const authorization = `Bearer ${config.accessToken}`;
  const service = new TongjiOpenapiService<AxiosRequestConfig>({
    baseURL: config.baseUrl ?? DEFAULT_TONGJI_OPENAPI_BASE_URL,
    request: (requestConfig, options) =>
      axios
        .request({
          ...requestConfig,
          ...options,
          timeout: options?.timeout ?? timeoutMs,
        })
        .then((response) => response.data),
  });

  return {
    service,
    withAuthorization: (request) => ({ ...request, Authorization: authorization }),
  };
};

// getUndergraduateScores 查询本科生学期成绩。
export const getUndergraduateScores = async (
  config: TongjiOpenapiAdapterConfig,
  calendarId?: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Undergraduate_scoreGET(
    adapter.withAuthorization({ calendarId }),
  );
};

// getAllTermCalendars 查询所有学期日历。
export const getAllTermCalendars = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_all_term_calendarGET(
    adapter.withAuthorization({}),
  );
};

// getCurrentTermCalendar 查询当前学期日历。
export const getCurrentTermCalendar = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_current_term_calendarGET(
    adapter.withAuthorization({}),
  );
};
