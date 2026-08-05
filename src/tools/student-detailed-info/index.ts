import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    getAllStudentDetailedInfo,
    getUserBasicInfo,
} from "../../integration/tongji_openapi";
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
    StudentDetailedInfo,
    StudentDetailedInfoData,
    StudentDetailedInfoToolResult,
} from "./types";

// STUDENT_DETAILED_INFO_TOOL_NAME 表示学生详细学籍信息查询工具名称。
export const STUDENT_DETAILED_INFO_TOOL_NAME =
    "tongji.student.detailed_info";

// STUDENT_DETAILED_INFO_SCHEMA 表示单条学生详细学籍信息的 MCP 输出结构。
const STUDENT_DETAILED_INFO_SCHEMA = z.object({
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

// STUDENT_DETAILED_INFO_OUTPUT_SCHEMA 表示学生详细学籍信息查询的 MCP 输出结构。
const STUDENT_DETAILED_INFO_OUTPUT_SCHEMA = z.object({
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

// registerStudentDetailedInfoTool 注册学生详细学籍信息查询工具。
export const registerStudentDetailedInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        STUDENT_DETAILED_INFO_TOOL_NAME,
        {
            title: "查询学生详细学籍信息",
            description: "查询当前已授权学生的教务系统详细学籍信息。",
            inputSchema: {},
            outputSchema: STUDENT_DETAILED_INFO_OUTPUT_SCHEMA,
        },
        async () => {
            const accessToken = context.invocation.accessToken;
            if (!accessToken) {
                return createErrorResult(
                    "unauthorized",
                    "未提供同济账号授权，请重新完成授权后再试。",
                );
            }

            try {
                const userId = await readCurrentUserId(accessToken);
                if (!userId) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济人员基础信息服务返回异常，请稍后重试。",
                    );
                }

                const response = await getAllStudentDetailedInfo(
                    { accessToken },
                    userId,
                );
                const data = normalizeStudentDetailedInfoData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济学生详细学籍信息服务返回异常，请稍后重试。",
                    );
                }
                const result: StudentDetailedInfoToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(
                    error,
                    { upstreamUnavailable: "同济学生详细学籍信息服务暂时不可用，请稍后重试。" },
                );
            }
        },
    );
};

// readCurrentUserId 从人员基础信息中读取当前授权用户的 userId，仅供服务端调用上游接口使用。
const readCurrentUserId = async (accessToken: string): Promise<string | null> => {
    const response = await getUserBasicInfo({ accessToken });
    const data = unwrapResponseData(response);
    if (!isRecord(data) || !Array.isArray(data.list)) {
        return null;
    }
    for (const item of readArray(data.list)) {
        const userId = readString(isRecord(item) ? item.userId : undefined);
        if (userId) {
            return userId;
        }
    }
    return null;
};

// normalizeStudentDetailedInfoData 裁剪并规范化学生详细学籍信息业务数据。
const normalizeStudentDetailedInfoData = (
    data: unknown,
): StudentDetailedInfoData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    return {
        list: readArray(data).map(normalizeStudentDetailedInfo),
    };
};

// normalizeStudentDetailedInfo 裁剪并规范化单条学生详细学籍信息。
const normalizeStudentDetailedInfo = (info: unknown): StudentDetailedInfo => {
    const source = isRecord(info) ? info : {};
    return {
        nation: readString(source.nation),
        faculty: readString(source.faculty),
        degreeCategory: readString(source.degreeCategory),
        enrolDate: readString(source.enrolDate),
        cultureProfession: readString(source.cultureProfession),
        state: readString(source.state),
        profession: readString(source.profession),
        expectedGraduationDate: readString(source.expectedGraduationDate),
        campus: readString(source.campus),
        degree: readString(source.degree),
        enrolMethods: readString(source.enrolMethods),
        studentSource: readString(source.studentSource),
        grade: readNumber(source.grade),
        name: readString(source.name),
        householdRegister: readString(source.householdRegister),
        trainingMethods: readString(source.trainingMethods),
        maritalStatus: readString(source.maritalStatus),
        birthday: readString(source.birthday),
        projId: readString(source.projId),
        leaveSchool: readString(source.leaveSchool),
        degreeType: readString(source.degreeType),
        learningStyle: readString(source.learningStyle),
        studentId: readString(source.studentId),
        enrolCategory: readString(source.enrolCategory),
        trainingLevel: readString(source.trainingLevel),
        politicalStatus: readString(source.politicalStatus),
        sex: readString(source.sex),
        enrolSeason: readString(source.enrolSeason),
        teacherId: readString(source.teacherId),
        mailingAddress: readString(source.mailingAddress),
        formLearning: readString(source.formLearning),
        stationTermini: readString(source.stationTermini),
        researchDirection: readString(source.researchDirection),
        lengthSchooling: readString(source.lengthSchooling),
        stationStart: readString(source.stationStart),
    };
};
