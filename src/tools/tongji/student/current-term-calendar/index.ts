import { CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getCurrentTermCalendar } from "../../../../integration/tongji_openapi";
import { isRecord, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { CurrentTermCalendar, } from "./types";
// CURRENT_TERM_CALENDAR_TOOL_NAME 表示当前学期日历查询工具名称。
export const CURRENT_TERM_CALENDAR_TOOL_NAME = "tongji.student.current-term-calendar";
// registerCurrentTermCalendarTool 注册当前学期日历查询工具。
export const registerCurrentTermCalendarTool = campusTool({
    name: CURRENT_TERM_CALENDAR_TOOL_NAME,
    title: "查询当前学期日历",
    description: "查询同济大学当前学期的日历摘要，包含学年、学期、周数、当前所处教学周及学期描述。",
    input: z.object({}).strict(),
    output: CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济当前学期日历服务返回异常，请稍后重试。", upstreamUnavailable: "同济当前学期日历服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getCurrentTermCalendar(config);
    },
    mapResponse: (response) => {
        const data = normalizeCurrentTermCalendarData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof CURRENT_TERM_CALENDAR_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data: isEmptyData(data) ? null : data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// EMPTY_CURRENT_TERM_CALENDAR 表示全字段为 null 的空当前学期日历。
const EMPTY_CURRENT_TERM_CALENDAR: CurrentTermCalendar = {
    calendarId: null,
    beginDay: null,
    endDay: null,
    examWeekEnd: null,
    examWeekStart: null,
    teachingWeekEnd: null,
    teachingWeekStart: null,
    year: null,
    term: null,
    weekNum: null,
    week: null,
    simpleName: null,
    now: null,
    name: null,
};
// normalizeCurrentTermCalendarData 裁剪并规范化当前学期日历业务数据。
const normalizeCurrentTermCalendarData = (data: unknown): CurrentTermCalendar | undefined => {
    if (data === null) {
        return EMPTY_CURRENT_TERM_CALENDAR;
    }
    if (!isRecord(data) || !isRecord(data.schoolCalendar)) {
        return undefined;
    }
    const schoolCalendar = data.schoolCalendar;
    return {
        calendarId: readNumber(schoolCalendar.id),
        beginDay: readNumber(schoolCalendar.beginDay),
        endDay: readNumber(schoolCalendar.endDay),
        examWeekEnd: readNumber(schoolCalendar.examWeekEnd),
        examWeekStart: readNumber(schoolCalendar.examWeekStart),
        teachingWeekEnd: readNumber(schoolCalendar.teachingWeekEnd),
        teachingWeekStart: readNumber(schoolCalendar.teachingWeekStart),
        year: readNumber(schoolCalendar.year),
        term: readNumber(schoolCalendar.term),
        weekNum: readNumber(schoolCalendar.weekNum),
        week: readNumber(data.week),
        simpleName: readString(data.simpleName),
        now: readString(data.now),
        name: readString(data.name),
    };
};
// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: CurrentTermCalendar): boolean => data.calendarId === null &&
    data.beginDay === null &&
    data.endDay === null &&
    data.examWeekEnd === null &&
    data.examWeekStart === null &&
    data.teachingWeekEnd === null &&
    data.teachingWeekStart === null &&
    data.year === null &&
    data.term === null &&
    data.weekNum === null &&
    data.week === null &&
    data.simpleName === null &&
    data.now === null &&
    data.name === null;
