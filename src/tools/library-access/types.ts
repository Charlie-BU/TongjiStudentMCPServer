import { ToolStatus } from "../types";

// LibraryAccessRecord 表示单条图书馆通行记录。
export interface LibraryAccessRecord {
    deptName: string | null;
    direction: string | null;
    door: string | null;
    libPlace: string | null;
    name: string | null;
    type: string | null;
    visitTime: string | null;
}

// LibraryAccessData 表示图书馆通行记录的脱敏业务数据。
export interface LibraryAccessData {
    userInfos: LibraryAccessRecord[];
}

// LibraryAccessToolResult 表示图书馆通行查询的结构化结果。
export interface LibraryAccessToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: LibraryAccessData;
    source: "Tongji Open Platform";
    direction?: string;
    visitStartTime?: string;
    visitEndTime?: string;
}
