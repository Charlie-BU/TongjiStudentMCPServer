import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCompetitionPrizes } from "../../integration/tongji_openapi";
import type { ToolRegistrationContext } from "../registry";
import {
    createErrorResult,
    isRecord,
    readArray,
    readString,
    toErrorResult,
    unwrapResponseData,
} from "../utils";
import type {
    CompetitionPrize,
    CompetitionPrizeData,
    CompetitionPrizeToolResult,
} from "./types";

// COMPETITION_PRIZE_TOOL_NAME 表示本科生竞赛奖励查询工具名称。
export const COMPETITION_PRIZE_TOOL_NAME = "tongji.student.competition_prize";

// COMPETITION_PRIZE_SCHEMA 表示单条竞赛奖励记录的 MCP 输出结构。
const COMPETITION_PRIZE_SCHEMA = z.object({
    awardCategory: z.string().nullable().describe("奖励类别，例如竞赛获奖。"),
    awardDate: z.string().nullable().describe("获奖时间。"),
    awardLevel: z.string().nullable().describe("奖项等级，例如一等奖。"),
    competitionLevel: z.string().nullable().describe("比赛等级，例如校级。"),
    competitionName: z.string().nullable().describe("比赛名称。"),
    deptName: z.string().nullable().describe("获奖记录所属部门名称。"),
    name: z.string().nullable().describe("获奖人姓名，以上游返回内容为准。"),
    schoolYear: z.string().nullable().describe("获奖记录所属学年。"),
});

// COMPETITION_PRIZE_OUTPUT_SCHEMA 表示本科生竞赛奖励查询的 MCP 输出结构。
const COMPETITION_PRIZE_OUTPUT_SCHEMA = z.object({
    status: z
        .enum(["ok", "empty"])
        .describe("查询状态，empty 表示没有可返回的竞赛奖励记录。"),
    data: z.object({
        list: z
            .array(COMPETITION_PRIZE_SCHEMA)
            .describe("当前授权本科生的竞赛奖励记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("竞赛奖励数据来源。"),
});

// registerCompetitionPrizeTool 注册本科生竞赛奖励查询工具。
export const registerCompetitionPrizeTool = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    server.registerTool(
        COMPETITION_PRIZE_TOOL_NAME,
        {
            title: "查询本科生竞赛奖励记录",
            description: "查询当前已授权本科生的竞赛获奖与奖励记录。",
            inputSchema: {},
            outputSchema: COMPETITION_PRIZE_OUTPUT_SCHEMA,
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
                const response = await getCompetitionPrizes({ accessToken });
                const data = normalizeCompetitionPrizeData(
                    unwrapResponseData(response),
                );
                if (!data) {
                    return createErrorResult(
                        "upstream_unavailable",
                        "同济竞赛奖励服务返回异常，请稍后重试。",
                    );
                }
                const result: CompetitionPrizeToolResult = {
                    status: data.list.length === 0 ? "empty" : "ok",
                    data,
                    source: "Tongji Open Platform",
                };
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }],
                };
            } catch (error) {
                return toErrorResult(error, {
                    upstreamUnavailable:
                        "同济竞赛奖励服务暂时不可用，请稍后重试。",
                });
            }
        },
    );
};

// normalizeCompetitionPrizeData 裁剪并规范化本科生竞赛奖励业务数据。
const normalizeCompetitionPrizeData = (
    data: unknown,
): CompetitionPrizeData | undefined => {
    if (!isRecord(data)) {
        return undefined;
    }
    if (data.list === null) {
        return {
            list: [],
        };
    }
    if (!Array.isArray(data.list)) {
        return undefined;
    }
    return {
        list: readArray(data.list).map(normalizeCompetitionPrize),
    };
};

// normalizeCompetitionPrize 裁剪并规范化单条竞赛奖励记录。
const normalizeCompetitionPrize = (prize: unknown): CompetitionPrize => {
    const source = isRecord(prize) ? prize : {};
    return {
        awardCategory: readString(source.awardCategory),
        awardDate: readString(source.awardDate),
        awardLevel: readString(source.awardLevel),
        competitionLevel: readString(source.competitionLevel),
        competitionName: readString(source.competitionName),
        deptName: readString(source.deptName),
        name: readString(source.name),
        schoolYear: readString(source.schoolYear),
    };
};
