import { ToolStatus } from "../types";

// TimetableSchedule 表示单次排课细则。
export interface TimetableSchedule {
    dayOfWeek: number | null;
    timeStart: number | null;
    timeEnd: number | null;
    weekNum: string | null;
    weekstr: string | null;
    weeks: number[];
    popover: string | null;
    roomIdI18n: string | null;
    campusI18n: string | null;
}

// StudentTimetableCourse 表示单门课程的课表信息。
export interface StudentTimetableCourse {
    classCode: string | null;
    className: string | null;
    courseCode: string | null;
    courseName: string | null;
    credits: number | null;
    teacherName: string | null;
    classTime: string | null;
    classRoom: string | null;
    classRoomPractice: string | null;
    remark: string | null;
    timeTableList: TimetableSchedule[];
    campusI18n: string | null;
    assessmentModeI18n: string | null;
    classRoomI18n: string | null;
    teachingWayI18n: string | null;
}

// StudentTimetableData 表示学生课表的脱敏业务数据。
export interface StudentTimetableData {
    list: StudentTimetableCourse[];
}

// StudentTimetableToolResult 表示学生课表查询的结构化结果。
export interface StudentTimetableToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: StudentTimetableData;
    source: "Tongji Open Platform";
    calendarId?: string;
}
