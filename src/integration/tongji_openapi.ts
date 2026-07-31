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

// getCompetitionPrizes 查询本科生竞赛奖励记录。
export const getCompetitionPrizes = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_competition_prizesGET(adapter.withAuthorization({}));
};

// getStudentHonoraryTitles 查询学生获得荣誉称号情况信息。
export const getStudentHonoraryTitles = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Student_honorary_titleGET(adapter.withAuthorization({}));
};

// getStudentScholarshipInfo 查询学生获得奖学金情况信息。
export const getStudentScholarshipInfo = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_scholarship_infoGET(adapter.withAuthorization({}));
};

// getAllStudentDetailedInfo 获取教务系统所有的学生详细信息。
export const getAllStudentDetailedInfo = async (
  config: TongjiOpenapiAdapterConfig,
  userId: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_student_detailed_infoPOST(
    adapter.withAuthorization({ userId }),
  );
};

// getUserBasicInfo 获取人员基础信息。
export const getUserBasicInfo = async (
  config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_user_basic_infoGET(adapter.withAuthorization({}));
};

// getStatisticsInfoByYear 根据年份查询当前授权人员的全校师生统计数据。
export const getStatisticsInfoByYear = async (
  config: TongjiOpenapiAdapterConfig,
  year: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_statistics_info_by_yearGET(
    adapter.withAuthorization({ year }),
  );
};

// getCardSpendingFlow 根据数据时间查询人员一卡通历史流水信息。
export const getCardSpendingFlow = async (
  config: TongjiOpenapiAdapterConfig,
  tradeStartTime?: string,
  tradeEndTime?: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_card_spending_flowGET(
    adapter.withAuthorization({ tradeStartTime, tradeEndTime }),
  );
};

// getStudentTimetable 获取1tongji系统上学生课表信息，支持当前学期和历史学期实时查询。
export const getStudentTimetable = async (
  config: TongjiOpenapiAdapterConfig,
  calendarId?: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Student_timetableGET(
    adapter.withAuthorization({ calendarId }),
  );
};

// getSchoolAccess 查询在某一段时间内进出校门门禁的信息。
export const getSchoolAccess = async (
  config: TongjiOpenapiAdapterConfig,
  portNum?: string,
  dataStartTime?: string,
  dataEndTime?: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_school_accessGET(
    adapter.withAuthorization({ portNum, dataStartTime, dataEndTime }),
  );
};

// getLibraryAccess 根据学工号查询在某一段时间内进出图书馆闸机门禁信息。
export const getLibraryAccess = async (
  config: TongjiOpenapiAdapterConfig,
  direction?: string,
  visitStartTime?: string,
  visitEndTime?: string,
): Promise<unknown> => {
  const adapter = createTongjiOpenapiAdapter(config);
  return adapter.service.Get_library_accessGET(
    adapter.withAuthorization({ direction, visitStartTime, visitEndTime }),
  );
};
