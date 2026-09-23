import { STUDENT_DETAILED_INFO_OUTPUT_SCHEMA } from "./schemas";
import { campusTool } from "../../campus-tool";
import { z } from "zod";
import { getAllStudentDetailedInfo, } from "../../../../integration/tongji_openapi";
import { isRecord, readArray, readNumber, readString, unwrapResponseData, } from "../../../utils";
import type { StudentDetailedInfo, StudentDetailedInfoData, } from "./types";
// STUDENT_DETAILED_INFO_TOOL_NAME 表示学生详细学籍信息查询工具名称。
export const STUDENT_DETAILED_INFO_TOOL_NAME = "tongji.student.detailed_info";
// registerStudentDetailedInfoTool 注册学生详细学籍信息查询工具。
export const registerStudentDetailedInfoTool = campusTool({
    name: STUDENT_DETAILED_INFO_TOOL_NAME,
    title: "查询学生详细学籍信息",
    description: "查询当前已授权学生的教务系统详细学籍信息。",
    input: z.object({}).strict(),
    output: STUDENT_DETAILED_INFO_OUTPUT_SCHEMA,
    errors: { invalidResponse: "同济人员基础信息服务返回异常，请稍后重试。", upstreamUnavailable: "同济学生详细学籍信息服务暂时不可用，请稍后重试。" },
    query: (config, _input) => {
        return getAllStudentDetailedInfo(config);
    },
    mapResponse: (response) => {
        const data = normalizeStudentDetailedInfoData(unwrapResponseData(response));
        if (!data)
            return undefined;
        const result: z.input<typeof STUDENT_DETAILED_INFO_OUTPUT_SCHEMA> = {
            status: data.list.length === 0 ? "empty" : "ok",
            data,
            source: "Tongji Open Platform",
        };
        return result;
    },
}).register;
// normalizeStudentDetailedInfoData 裁剪并规范化学生详细学籍信息业务数据。
const normalizeStudentDetailedInfoData = (data: unknown): StudentDetailedInfoData | undefined => {
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
