import { z } from "zod";

export const STUDENT_DETAILED_INFO_SCHEMA = z.object({
    nation: z.string().nullable().describe("学生民族。"),
    faculty: z.string().nullable().describe("学生所属学院名称。"),
    degreeCategory: z.string().nullable().describe("学位类别。"),
    enrolDate: z.string().nullable().describe("学生入学日期。"),
    cultureProfession: z.string().nullable().describe("培养专业名称。"),
    state: z.string().nullable().describe("学生国籍。"),
    profession: z.string().nullable().describe("专业名称。"),
    expectedGraduationDate: z.string().nullable().describe("预计毕业日期。"),
    campus: z.string().nullable().describe("所在校区名称。"),
    degree: z.string().nullable().describe("拟获得的学位名称。"),
    enrolMethods: z.string().nullable().describe("录取或入学方式。"),
    studentSource: z.string().nullable().describe("生源地。"),
    grade: z.number().nullable().describe("学生所在年级。"),
    name: z.string().nullable().describe("学生姓名，以上游返回内容为准。"),
    householdRegister: z.string().nullable().describe("户籍所在地。"),
    trainingMethods: z.string().nullable().describe("培养方式。"),
    maritalStatus: z.string().nullable().describe("婚姻状况。"),
    birthday: z.string().nullable().describe("出生日期。"),
    projId: z.string().nullable().describe("项目或学生类别。"),
    leaveSchool: z.string().nullable().describe("学籍或在校状态。"),
    degreeType: z
        .string()
        .nullable()
        .describe("学位类型，例如专业型或学术型。"),
    learningStyle: z
        .string()
        .nullable()
        .describe("学习形式，例如脱产或半脱产。"),
    studentId: z.string().nullable().describe("学生学号。"),
    enrolCategory: z.string().nullable().describe("录取类别。"),
    trainingLevel: z
        .string()
        .nullable()
        .describe("培养层次，例如硕士、博士或本科。"),
    politicalStatus: z.string().nullable().describe("政治面貌。"),
    sex: z.string().nullable().describe("学生性别。"),
    enrolSeason: z.string().nullable().describe("入学季节。"),
    teacherId: z
        .string()
        .nullable()
        .describe("导师编号或后端映射后的导师姓名。"),
    mailingAddress: z.string().nullable().describe("通讯地址或联系地址。"),
    formLearning: z
        .string()
        .nullable()
        .describe("学习形式，例如全日制或非全日制。"),
    stationTermini: z.string().nullable().describe("乘车优惠区间终点。"),
    researchDirection: z.string().nullable().describe("研究方向或具体项目。"),
    lengthSchooling: z.string().nullable().describe("学制，单位年。"),
    stationStart: z.string().nullable().describe("乘车优惠区间起点。"),
});

export const STUDENT_DETAILED_INFO_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的学生详细学籍信息。"),
    data: z.object({
        list: z
            .array(STUDENT_DETAILED_INFO_SCHEMA)
            .describe("当前授权学生的详细学籍信息记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("学生详细学籍信息数据来源。"),
});
