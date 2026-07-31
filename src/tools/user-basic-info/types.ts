import { ToolStatus } from "../types";

// UserBasicInfo 表示单条人员基础信息记录。
export interface UserBasicInfo {
    deptName: string | null;
    name: string | null;
    statusName: string | null;
    userTypeName: string | null;
}

// UserBasicInfoData 表示人员基础信息的脱敏业务数据。
export interface UserBasicInfoData {
    list: UserBasicInfo[];
}

// UserBasicInfoToolResult 表示人员基础信息查询的结构化结果。
export interface UserBasicInfoToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: UserBasicInfoData;
    source: "Tongji Open Platform";
}
