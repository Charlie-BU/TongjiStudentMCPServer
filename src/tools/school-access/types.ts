import { ToolStatus } from "../types";

// SchoolAccessRecord 表示单条校门通行记录。
export interface SchoolAccessRecord {
    dataTime: string | null;
    deptName: string | null;
    equptName: string | null;
    lctnName: string | null;
    name: string | null;
    portNum: string | null;
    sex: string | null;
}

// SchoolAccessData 表示校门通行记录的脱敏业务数据。
export interface SchoolAccessData {
    count: number | null;
    userInfos: SchoolAccessRecord[];
}

// SchoolAccessToolResult 表示校门通行查询的结构化结果。
export interface SchoolAccessToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: SchoolAccessData;
    source: "Tongji Open Platform";
    portNum?: string;
    dataStartTime?: string;
    dataEndTime?: string;
}
