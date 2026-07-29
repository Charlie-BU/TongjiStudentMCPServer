import axios from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStatisticsInfo } from "../integration/tongji_openapi";
import type { ToolRegistrationContext } from "./registry";

// STATISTICS_INFO_TOOL_NAME 表示个人统计数据查询工具名称。
export const STATISTICS_INFO_TOOL_NAME = "tongji.student.statistics-info";

// StatisticsInfoToolStatus 表示个人统计数据查询的结果状态。
type StatisticsInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

// StatisticsRecord 表示单条个人统计记录。
interface StatisticsRecord {
    bookCategory: string | null;
    bookCoun: number | null;
    bookFirst: string | null;
    canteenAmount: number | null;
    canteenAmtPercentileRank: number | null;
    canteenCoun: number | null;
    canteenOften: string | null;
    canteenOftenPercentileRank: number | null;
    cardPelaceCoun: number | null;
    college: string | null;
    consumMostAmount: number | null;
    consumMostTime: string | null;
    consumePlaceOften: string | null;
    consumeTotal: number | null;
    consumeTotalPercentileRank: number | null;
    earlistTime: string | null;
    entYear: number | null;
    entranceCoun: number | null;
    firstCardPlaceTime: string | null;
    gender: string | null;
    latestTime: string | null;
    major: string | null;
    marketAmount: number | null;
    rechargeTimeSlot: string | null;
    rideCoun: number | null;
    scholarshipCoun: number | null;
    sname: string | null;
    stayTime: number | null;
    stayTimePercentileRank: number | null;
    stayYear: number | null;
    stuLevel: string | null;
    userId: string | null;
}

// StatisticsInfoData 表示个人统计的脱敏业务数据。
interface StatisticsInfoData {
    records: StatisticsRecord[];
}

// StatisticsInfoToolResult 表示个人统计数据查询的结构化结果。
interface StatisticsInfoToolResult {
    [key: string]: unknown;
    status: StatisticsInfoToolStatus;
    data: StatisticsInfoData;
    source: "Tongji Open Platform";
}

// STATISTICS_RECORD_SCHEMA 表示单条个人统计记录的 MCP 输出结构。
const STATISTICS_RECORD_SCHEMA = z.object({
    bookCategory: z.string().nullable().describe("借阅最多的图书主题类别。"),
    bookCoun: z.number().nullable().describe("累计借阅图书数量。"),
    bookFirst: z.string().nullable().describe("借阅的第一本书的书名。"),
    canteenAmount: z.number().nullable().describe("食堂累计消费总金额。"),
    canteenAmtPercentileRank: z.number().nullable().describe("食堂总消费超过同济人的百分比。"),
    canteenCoun: z.number().nullable().describe("在食堂累计消费次数。"),
    canteenOften: z.string().nullable().describe("最常去的食堂名称。"),
    canteenOftenPercentileRank: z.number().nullable().describe("最常去食堂的消费占比百分比。"),
    cardPelaceCoun: z.number().nullable().describe("校园卡补卡次数。"),
    college: z.string().nullable().describe("所属学院，已由上游做脱敏处理。"),
    consumMostAmount: z.number().nullable().describe("单日最高消费金额。"),
    consumMostTime: z.string().nullable().describe("单笔最大消费的发生时间。"),
    consumePlaceOften: z.string().nullable().describe("最常光顾的消费场所名称。"),
    consumeTotal: z.number().nullable().describe("校园卡累计消费总金额。"),
    consumeTotalPercentileRank: z.number().nullable().describe("全部消费总金额超过同济人的百分比。"),
    earlistTime: z.string().nullable().describe("最早进入图书馆的时间。"),
    entYear: z.number().nullable().describe("入学年份。"),
    entranceCoun: z.number().nullable().describe("累计进入图书馆次数。"),
    firstCardPlaceTime: z.string().nullable().describe("第一次补卡的时间。"),
    gender: z.string().nullable().describe("性别，0 表示未知。"),
    latestTime: z.string().nullable().describe("最晚离开图书馆的时间。"),
    major: z.string().nullable().describe("专业名称，已由上游做脱敏处理。"),
    marketAmount: z.number().nullable().describe("在校园超市累计消费金额。"),
    rechargeTimeSlot: z.string().nullable().describe("最常进行校园卡充值的时段，以 2 小时为间隔。"),
    rideCoun: z.number().nullable().describe("乘坐校车在校区间往返的次数。"),
    scholarshipCoun: z.number().nullable().describe("获得奖学金的次数。"),
    sname: z.string().nullable().describe("学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    stayTime: z.number().nullable().describe("在图书馆累计停留的小时数。"),
    stayTimePercentileRank: z.number().nullable().describe("图书馆在馆时长超过同济人的百分比。"),
    stayYear: z.number().nullable().describe("在本校就读的总年数（本研合计）。"),
    stuLevel: z.string().nullable().describe("学历层次，0 表示本科，1 表示硕士，2 表示博士，9 表示教师。"),
    userId: z.string().nullable().describe("学工号，已由上游做脱敏处理，不可用于身份验证。"),
});

// STATISTICS_INFO_OUTPUT_SCHEMA 表示个人统计数据查询的 MCP 输出结构。
const STATISTICS_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的个人统计数据。"),
    data: z.object({
        records: z.array(STATISTICS_RECORD_SCHEMA).describe("个人统计数据记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("统计数据来源。"),
});

// registerStatisticsInfoTool 注册个人统计数据查询工具。
export const registerStatisticsInfoTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        STATISTICS_INFO_TOOL_NAME,
        {
            title: "查询个人统计数据",
            description:
                "查询当前已授权学生的校园生活统计数据，包括图书馆使用、食堂消费、校车乘坐、超市购物、奖学金及校园卡使用等维度。",
            inputSchema: {},
            outputSchema: STATISTICS_INFO_OUTPUT_SCHEMA,
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
                const response = await getStatisticsInfo(
                    { accessToken },
                );
                const data = normalizeStatisticsInfoData(unwrapResponseData(response));
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济个人统计服务返回异常，请稍后重试。",
                    );
                }
                const result: StatisticsInfoToolResult = {
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

// normalizeStatisticsInfoData 裁剪并规范化个人统计业务数据。
const normalizeStatisticsInfoData = (data: unknown): StatisticsInfoData | undefined => {
    if (!Array.isArray(data)) {
        return undefined;
    }
    const records = (data as unknown[]).map(normalizeStatisticsRecord);
    return { records };
};

// normalizeStatisticsRecord 裁剪并规范化单条个人统计记录。
const normalizeStatisticsRecord = (item: unknown): StatisticsRecord => {
    const source = isRecord(item) ? item : {};
    return {
        bookCategory: readString(source.bookCategory),
        bookCoun: readNumber(source.bookCoun),
        bookFirst: readString(source.bookFirst),
        canteenAmount: readNumber(source.canteenAmount),
        canteenAmtPercentileRank: readNumber(source.canteenAmtPercentileRank),
        canteenCoun: readNumber(source.canteenCoun),
        canteenOften: readString(source.canteenOften),
        canteenOftenPercentileRank: readNumber(source.canteenOftenPercentileRank),
        cardPelaceCoun: readNumber(source.cardPelaceCoun),
        college: readString(source.college),
        consumMostAmount: readNumber(source.consumMostAmount),
        consumMostTime: readString(source.consumMostTime),
        consumePlaceOften: readString(source.consumePlaceOften),
        consumeTotal: readNumber(source.consumeTotal),
        consumeTotalPercentileRank: readNumber(source.consumeTotalPercentileRank),
        earlistTime: readString(source.earlistTime),
        entYear: readNumber(source.entYear),
        entranceCoun: readNumber(source.entranceCoun),
        firstCardPlaceTime: readString(source.firstCardPlaceTime),
        gender: readString(source.gender),
        latestTime: readString(source.latestTime),
        major: readString(source.major),
        marketAmount: readNumber(source.marketAmount),
        rechargeTimeSlot: readString(source.rechargeTimeSlot),
        rideCoun: readNumber(source.rideCoun),
        scholarshipCoun: readNumber(source.scholarshipCoun),
        sname: readString(source.sname),
        stayTime: readNumber(source.stayTime),
        stayTimePercentileRank: readNumber(source.stayTimePercentileRank),
        stayYear: readNumber(source.stayYear),
        stuLevel: readString(source.stuLevel),
        userId: readString(source.userId),
    };
};

// isEmptyData 判断业务数据是否为空。
const isEmptyData = (data: StatisticsInfoData): boolean =>
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
        "同济个人统计服务暂时不可用，请稍后重试。",
    );
};

// createErrorResult 创建 MCP 工具错误结果。
const createErrorResult = (
    status: Exclude<StatisticsInfoToolStatus, "ok" | "empty">,
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
