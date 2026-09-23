import { TERM_CALENDAR_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getAllTermCalendars } from "../../../../integration/tongji_openapi";
import { isRecord, readBoolean, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { TermCalendar, TermCalendarData, } from "./types";
// TERM_CALENDAR_TOOL_NAME 表示学期日历查询工具名称。
export const TERM_CALENDAR_TOOL_NAME = "tongji.user.term-calendar";
// registerAllTermCalendarTool 注册学期日历查询工具。
export const registerAllTermCalendarTool = campusTool({
    audience: "user",
    name: TERM_CALENDAR_TOOL_NAME,
    title: "查询学期日历",
    description: "查询同济大学所有学期的日历信息，返回学期ID、年份、学期编号、起止日期、周数、学年分段名称、学期完整名称及当前/下一学期标识。学期编号可用于查询课表、成绩等其他接口。",
    input: z.object({}).strict(),
    output: TERM_CALENDAR_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济学期日历服务返回异常，请稍后重试。", upstreamUnavailable: "同济学期日历服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getAllTermCalendars(config);
    },
    mapResponse: (response) => {
        const data = normalizeTermCalendarData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof TERM_CALENDAR_OUTPUT_SCHEMA> = {
            status: isEmptyData(data) ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeTermCalendarData 裁剪并规范化学期日历业务数据。
const normalizeTermCalendarData = (data: unknown): TermCalendarData | undefined => {
    if (data === null) {
        return { terms: [] };
    }
    if (!Array.isArray(data)) {
        return undefined;
    }
    const terms = data.map(normalizeTermCalendar);
    return { terms };
};
// normalizeTermCalendar 裁剪并规范化单条学期日历。
const normalizeTermCalendar = (item: unknown): TermCalendar => {
    const source = isRecord(item) ? item : {};
    return {
        id: readNumber(source.id),
        year: readNumber(source.year),
        term: readNumber(source.term),
        beginDay: readNumber(source.beginDay),
        endDay: readNumber(source.endDay),
        weekNum: readNumber(source.weekNum),
        weekBenginDay: readNumber(source.weekBenginDay),
        gradePartOne: readString(source.gradePartOne),
        gradePartTwo: readString(source.gradePartTwo),
        fullName: readString(source.fullName),
        currentTermFlag: readBoolean(source.currentTermFlag),
        nextTermFlag: readBoolean(source.nextTermFlag),
        perTerm: readString(source.perTerm),
        perYear: readString(source.perYear),
    };
};
// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: TermCalendarData): boolean => data.terms.length === 0;
