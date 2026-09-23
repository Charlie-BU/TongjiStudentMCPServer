import { z } from "zod";

export const STUDENT_DETAILED_INFO_SCHEMA = z.object({
    nation: z.string().nullable().describe("民族"),
    faculty: z.string().nullable().describe("管理学院"),
    degreeCategory: z.string().nullable().describe("学位上报类别"),
    enrolDate: z.string().nullable().describe("入学时间"),
    cultureProfession: z.string().nullable().describe("培养专业"),
    state: z.string().nullable().describe("国家地区"),
    profession: z.string().nullable().describe("招生专业"),
    expectedGraduationDate: z.string().nullable().describe("预计毕业时间"),
    campus: z.string().nullable().describe("校区"),
    degree: z.string().nullable().describe("学位"),
    enrolMethods: z.string().nullable().describe("入学方式"),
    studentSource: z.string().nullable().describe("生源地"),
    grade: z.number().nullable().describe("入学年级"),
    name: z.string().nullable().describe("姓名"),
    householdRegister: z.string().nullable().describe("户口所在地"),
    trainingMethods: z.string().nullable().describe("培养方式"),
    maritalStatus: z.string().nullable().describe("婚姻状况"),
    birthday: z.string().nullable().describe("出生日期"),
    projId: z.string().nullable().describe("管理部门"),
    leaveSchool: z.string().nullable().describe("在校状态"),
    degreeType: z
        .string()
        .nullable()
        .describe("学位类型"),
    learningStyle: z
        .string()
        .nullable()
        .describe("学习方式"),
    studentId: z.string().nullable().describe("学号"),
    enrolCategory: z.string().nullable().describe("录取类别"),
    trainingLevel: z
        .string()
        .nullable()
        .describe("培养层次"),
    politicalStatus: z.string().nullable().describe("政治面貌"),
    sex: z.string().nullable().describe("性别"),
    enrolSeason: z.string().nullable().describe("入学季节"),
    teacherId: z
        .string()
        .nullable()
        .describe("导师"),
    mailingAddress: z.string().nullable().describe("法定送达地址"),
    formLearning: z
        .string()
        .nullable()
        .describe("学习形式"),
    stationTermini: z.string().nullable().describe("火车终点站"),
    researchDirection: z.string().nullable().describe("研究方向"),
    lengthSchooling: z.string().nullable().describe("学制"),
    stationStart: z.string().nullable().describe("火车起点站"),
});

export const STUDENT_DETAILED_INFO_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的学生详细学籍信息。"),
    data: z.object({
        list: z
            .array(STUDENT_DETAILED_INFO_SCHEMA)
            .describe("当前授权学生的详细学籍信息记录列表。"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("学生详细学籍信息数据来源。"),
});
