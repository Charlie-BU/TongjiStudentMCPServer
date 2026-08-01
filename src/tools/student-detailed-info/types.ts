import { ToolStatus } from "../types";

// StudentDetailedInfo 表示单条学生详细学籍信息。
export interface StudentDetailedInfo {
    nation: string | null;
    faculty: string | null;
    degreeCategory: string | null;
    enrolDate: string | null;
    cultureProfession: string | null;
    state: string | null;
    profession: string | null;
    expectedGraduationDate: string | null;
    campus: string | null;
    degree: string | null;
    enrolMethods: string | null;
    studentSource: string | null;
    grade: number | null;
    name: string | null;
    householdRegister: string | null;
    trainingMethods: string | null;
    maritalStatus: string | null;
    birthday: string | null;
    projId: string | null;
    leaveSchool: string | null;
    degreeType: string | null;
    learningStyle: string | null;
    studentId: string | null;
    enrolCategory: string | null;
    trainingLevel: string | null;
    politicalStatus: string | null;
    sex: string | null;
    enrolSeason: string | null;
    teacherId: string | null;
    mailingAddress: string | null;
    formLearning: string | null;
    stationTermini: string | null;
    researchDirection: string | null;
    lengthSchooling: string | null;
    stationStart: string | null;
}

// StudentDetailedInfoData 表示学生详细学籍信息的脱敏业务数据。
export interface StudentDetailedInfoData {
    list: StudentDetailedInfo[];
}

// StudentDetailedInfoToolResult 表示学生详细学籍信息查询的结构化结果。
export interface StudentDetailedInfoToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: StudentDetailedInfoData;
    source: "Tongji Open Platform";
}
