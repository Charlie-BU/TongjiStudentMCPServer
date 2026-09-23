import { z } from "zod";

export const TIMETABLE_SCHEDULE_SCHEMA = z.object({
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

export const STUDENT_TIMETABLE_COURSE_SCHEMA = z.object({
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

export const STUDENT_TIMETABLE_OUTPUT_SCHEMA = z.object({
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
