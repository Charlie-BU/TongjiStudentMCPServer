import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAccommodationInfo } from "../integration/tongji_openapi";
import type { ToolRegistrationContext } from "./registry";

// ACCOMMODATION_INFO_TOOL_NAME 表示住宿信息查询工具名称。
export const ACCOMMODATION_INFO_TOOL_NAME = "tongji.student.accommodation-info";

// AccommodationInfoToolStatus 表示住宿信息查询的结果状态。
type AccommodationInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// AccommodationRecord 表示单条住宿记录。
interface AccommodationRecord {
    accomBuildingCode: string | null;
    accomBuildingName: string | null;
    accomRegionCode: string | null;
    accomRegionName: string | null;
    deptCode: string | null;
    deptName: string | null;
    floor: string | null;
    name: string | null;
    roomNo: string | null;
    userId: string | null;
    usertypeCode: string | null;
    usertypeName: string | null;
}

// AccommodationInfoData 表示住宿的脱敏业务数据。
interface AccommodationInfoData {
    records: AccommodationRecord[];
}

// AccommodationInfoToolResult 表示住宿信息查询的结构化结果。
interface AccommodationInfoToolResult {
    [key: string]: unknown;
    status: AccommodationInfoToolStatus;
    data: AccommodationInfoData;
    source: "Tongji Open Platform";
}

// ACCOMMODATION_RECORD_SCHEMA 表示单条住宿记录的 MCP 输出结构。
const ACCOMMODATION_RECORD_SCHEMA = z.object({
    accomBuildingCode: z.string().nullable().describe("宿舍楼代码。"),
    accomBuildingName: z.string().nullable().describe("宿舍楼名称。"),
    accomRegionCode: z.string().nullable().describe("宿舍区代码。"),
    accomRegionName: z.string().nullable().describe("宿舍区名称。"),
    deptCode: z.string().nullable().describe("所属部门/学院代码。"),
    deptName: z.string().nullable().describe("所属部门/学院名称。"),
    floor: z.string().nullable().describe("楼层。"),
    name: z.string().nullable().describe("学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    roomNo: z.string().nullable().describe("房间号。"),
    userId: z.string().nullable().describe("学号，已由上游做脱敏处理，不可用于身份验证。"),
    usertypeCode: z.string().nullable().describe("人员类型代码。"),
    usertypeName: z.string().nullable().describe("人员类型名称，例如硕士研究生。"),
});

// ACCOMMODATION_INFO_OUTPUT_SCHEMA 表示住宿信息查询的 MCP 输出结构。
const ACCOMMODATION_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的住宿记录。"),
    data: z.object({
        records: z.array(ACCOMMODATION_RECORD_SCHEMA).describe("住宿记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("住宿数据来源。"),
});

// registerAccommodationInfoTool 注册住宿信息查询工具。
export const registerAccommodationInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        ACCOMMODATION_INFO_TOOL_NAME,
        {
            title: "查询住宿信息",
            description:
                "查询当前已授权学生的住宿信息，返回宿舍楼、宿舍区、楼层、房间号及所属学院等信息。",
            inputSchema: {},
            outputSchema: ACCOMMODATION_INFO_OUTPUT_SCHEMA,
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
                const response = await getAccommodationInfo(
                    { accessToken },
                );
                const data = normalizeAccommodationInfoData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济住宿信息服务返回异常，请稍后重试。",
                    );
                }
                const result: AccommodationInfoToolResult = {
                    status: isEmptyData(data) ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                    structuredContent: result,
                };
            } catch (error) {
                return toErrorResult(error);
            }
        },
    );
};

// unwrapResponseData 提取上游响应中的业务数据。
const unwrapResponseData = (response: unknown): unknown => {
    if (isRecord(response) && "data" in response) {
        return response.data;
    }
    return response;
};

// normalizeAccommodationInfoData 裁剪并规范化住宿业务数据。
const normalizeAccommodationInfoData = (data: unknown): AccommodationInfoData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return { records: [] };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    const records = (data.list as unknown[]).map(normalizeAccommodationRecord);
    return { records };
};

// normalizeAccommodationRecord 裁剪并规范化单条住宿记录。
const normalizeAccommodationRecord = (item: unknown): AccommodationRecord => {
    const source = isRecord(item) ? item : {};
    return {
        accomBuildingCode: readString(source.accomBuildingCode),
        accomBuildingName: readString(source.accomBuildingName),
        accomRegionCode: readString(source.accomRegionCode),
        accomRegionName: readString(source.accomRegionName),
        deptCode: readString(source.deptCode),
        deptName: readString(source.deptName),
        floor: readString(source.floor),
        name: readString(source.name),
        roomNo: readString(source.roomNo),
        userId: readString(source.userId),
        usertypeCode: readString(source.usertypeCode),
        usertypeName: readString(source.usertypeName),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: AccommodationInfoData): boolean =>
    data.records.length === 0;

// readString 读取字符串字段。
const readString = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return null;
};

// readNumber 读取数值字段。
const readNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : null;
    }
    return null;
};

// toErrorResult 将上游错误转换为 MCP 工具错误结果。
const toErrorResult = (error: unknown) => {
    if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
    ) {
        return createErrorResult(
            "unauthorized",
            "同济账号授权无效或已过期，请重新完成授权后再试。",
        );
    }
    return createErrorResult(
        "upstream_unavailable",
        "同济住宿信息服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果。
const createErrorResult = (
    status: Exclude<AccommodationInfoToolStatus, "ok" | "empty">,
    message: string,
) => ({
    isError: true,
    content: [
        { type: "text" as const, text: JSON.stringify({ status, message }) },
    ],
});

// isRecord 判断值是否为对象记录。
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
