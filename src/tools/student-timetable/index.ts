import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStudentTimetable } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readNumber,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    StudentTimetableCourse,
    StudentTimetableData,
    StudentTimetableToolResult,
    TimetableSchedule,
} from "./types";

// STUDENT_TIMETABLE_TOOL_NAME 表示学生课表查询工具名称。
export const STUDENT_TIMETABLE_TOOL_NAME = "tongji.student.timetable";

// TIMETABLE_SCHEDULE_SCHEMA 表示单次排课细则的 MCP 输出结构。
const TIMETABLE_SCHEDULE_SCHEMA = z.object({
    dayOfWeek: z
        .number()
        .nullable()
        .describe("星期几，数字 1-7，用于在日历或格子课表中定位列。"),
    timeStart: z.number().nullable().describe("本次上课的开始节次。"),
    timeEnd: z.number().nullable().describe("本次上课的结束节次。"),
    weekNum: z.string().nullable().describe("本次上课的周次范围文本。"),
    weekstr: z.string().nullable().describe("本次上课的星期文本。"),
    weeks: z
        .array(z.number())
        .describe("本次排课实际发生的具体上课周次列表。"),
    popover: z
        .string()
        .nullable()
        .describe("鼠标悬停或点击课程时可展示的弹窗文本。"),
    roomIdI18n: z.string().nullable().describe("本次上课的教室名称。"),
    campusI18n: z.string().nullable().describe("本次上课所在校区名称。"),
});

// STUDENT_TIMETABLE_COURSE_SCHEMA 表示单门课程课表的 MCP 输出结构。
const STUDENT_TIMETABLE_COURSE_SCHEMA = z.object({
    classCode: z.string().nullable().describe("教学班级编号或选课代码。"),
    className: z.string().nullable().describe("班级名称，例如 01班。"),
    courseCode: z.string().nullable().describe("课程代码。"),
    courseName: z.string().nullable().describe("课程名称。"),
    credits: z.number().nullable().describe("课程学分。"),
    teacherName: z.string().nullable().describe("授课教师姓名。"),
    classTime: z
        .string()
        .nullable()
        .describe("上课时间概要或汇总上课时间文本，适合列表直接展示。"),
    classRoom: z.string().nullable().describe("原始教室代码。"),
    classRoomPractice: z
        .string()
        .nullable()
        .describe("实践地点分类，例如校内或校外。"),
    remark: z.string().nullable().describe("课程备注信息，有值时可展示。"),
    timeTableList: z
        .array(TIMETABLE_SCHEDULE_SCHEMA)
        .describe("结构化课表细则数组，用于渲染日历或格子课表。"),
    campusI18n: z.string().nullable().describe("课程所在校区名称。"),
    assessmentModeI18n: z
        .string()
        .nullable()
        .describe("课程考核方式文本，例如考查或考试。"),
    classRoomI18n: z.string().nullable().describe("课程主教室名称。"),
    teachingWayI18n: z
        .string()
        .nullable()
        .describe("课程授课方式文本，例如线下授课或线上。"),
});

// STUDENT_TIMETABLE_OUTPUT_SCHEMA 表示学生课表查询的 MCP 输出结构。
const STUDENT_TIMETABLE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的学生课表。"),
    data: z.object({
        list: z
            .array(STUDENT_TIMETABLE_COURSE_SCHEMA)
            .describe("当前授权学生的课程课表列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("学生课表数据来源。"),
    calendarId: z.string().optional().describe("本次查询指定的学期编号。"),
});

// registerStudentTimetableTool 注册学生课表查询工具。
export const registerStudentTimetableTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        STUDENT_TIMETABLE_TOOL_NAME,
        {
            title: "查询学生课表",
            description:
                "查询当前已授权学生指定学期的 1Tongji 课表；不传 calendarId 时查询当前学期。",
            inputSchema: {
                calendarId: z
                    .preprocess(
                        (value) =>
                            typeof value === "number" ? String(value) : value,
                        z.string().trim().min(1),
                    )
                    .optional()
                    .describe(
                        "可选的学期编号；支持字符串或整数，不传时由同济开放平台查询当前学期。",
                    ),
            },
            outputSchema: STUDENT_TIMETABLE_OUTPUT_SCHEMA,
        },
        async ({ calendarId }) => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const response = await getStudentTimetable(
                    { accessToken },
                    calendarId,
                );
                const data = normalizeStudentTimetableData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济课表服务返回异常，请稍后重试。",
                    );
                }
                const result: StudentTimetableToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                    ...(calendarId ? { calendarId } : {}),
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "同济课表服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// normalizeStudentTimetableData 裁剪并规范化学生课表业务数据。
const normalizeStudentTimetableData = (
    data: unknown,
): StudentTimetableData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeStudentTimetableCourse),
    };
};

// normalizeStudentTimetableCourse 裁剪并规范化单门课程课表。
const normalizeStudentTimetableCourse = (
    course: unknown,
): StudentTimetableCourse => {
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
        timeTableList: readArray(source.timeTableList).map(
            normalizeTimetableSchedule,
        ),
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
