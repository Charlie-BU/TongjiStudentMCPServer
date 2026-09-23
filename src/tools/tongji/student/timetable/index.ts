import { STUDENT_TIMETABLE_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getStudentTimetable } from "../../../../integration/tongji_openapi";
import { isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { StudentTimetableCourse, StudentTimetableData, TimetableSchedule, } from "./types";
// STUDENT_TIMETABLE_TOOL_NAME 表示学生课表查询工具名称。
export const STUDENT_TIMETABLE_TOOL_NAME = "tongji.student.timetable";
// registerStudentTimetableTool 注册学生课表查询工具。
export const registerStudentTimetableTool = campusTool({
    audience: "student",
    name: STUDENT_TIMETABLE_TOOL_NAME,
    title: "查询学生课表",
    description: "查询当前已授权学生指定学期的 1Tongji 课表；不传 calendarId 时查询当前学期。",
    input: z.object({
        calendarId: z
            .preprocess((value) => typeof value === "number" ? String(value) : value, z.string().trim().regex(/^-?\d+$/))
            .optional()
            .describe("可选的学期编号；支持字符串或整数，不传时由同济开放平台查询当前学期。"),
    }).strict(),
    output: STUDENT_TIMETABLE_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济课表服务返回异常，请稍后重试。", upstreamUnavailable: "同济课表服务暂时不可用，请稍后重试。" },
    query: (config, { calendarId }) => {
        return getStudentTimetable(config, calendarId);
    },
    mapResponse: (response, { calendarId }) => {
        const data = normalizeStudentTimetableData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof STUDENT_TIMETABLE_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
            ...(calendarId ? { calendarId } : {}),
        };
        return result;
    },
}).register;
// normalizeStudentTimetableData 裁剪并规范化学生课表业务数据。
const normalizeStudentTimetableData = (data: unknown): StudentTimetableData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeStudentTimetableCourse),
    };
};
// normalizeStudentTimetableCourse 裁剪并规范化单门课程课表。
const normalizeStudentTimetableCourse = (course: unknown): StudentTimetableCourse => {
    const source = isRecord(course) ? course : {};
    return {
        classCode: readString(source.classCode),
        className: readString(source.className),
        courseCode: readString(source.courseCode),
        courseName: readString(source.courseName),
        credits: readNumber(source.credits),
        teacherName: readString(source.teacherName),
        classTime: readString(source.classTime),
        classRoom: readString(source.classRoom),
        classRoomPractice: readString(source.classRoomPractice),
        remark: readString(source.remark),
        timeTableList: readArray(source.timeTableList).map(normalizeTimetableSchedule),
        campusI18n: readString(source.campusI18n),
        assessmentModeI18n: readString(source.assessmentModeI18n),
        classRoomI18n: readString(source.classRoomI18n),
        teachingWayI18n: readString(source.teachingWayI18n),
    };
};
// normalizeTimetableSchedule 裁剪并规范化单次排课细则。
const normalizeTimetableSchedule = (schedule: unknown): TimetableSchedule => {
    const source = isRecord(schedule) ? schedule : {};
    return {
        dayOfWeek: readNumber(source.dayOfWeek),
        timeStart: readNumber(source.timeStart),
        timeEnd: readNumber(source.timeEnd),
        weekNum: readString(source.weekNum),
        weekstr: readString(source.weekstr),
        weeks: readArray(source.weeks)
            .map(readNumber)
            .filter((week): week is number => week !== null),
        popover: readString(source.popover),
        roomIdI18n: readString(source.roomIdI18n),
        campusI18n: readString(source.campusI18n),
    };
};
