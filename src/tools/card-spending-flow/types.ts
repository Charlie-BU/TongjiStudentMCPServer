import { ToolStatus } from "../types";

// CardSpendingFlowRecord 表示单条一卡通消费流水记录。
export interface CardSpendingFlowRecord {
    campusAreaName: string | null;
    cardBalance: number | null;
    mercName: string | null;
    mercTypeName: string | null;
    name: string | null;
    personTypeCode: string | null;
    restaurantName: string | null;
    tradeAmount: number | null;
    tradeDateTime: string | null;
}

// CardSpendingFlowData 表示一卡通消费流水的脱敏业务数据。
export interface CardSpendingFlowData {
    userInfos: CardSpendingFlowRecord[];
}

// CardSpendingFlowToolResult 表示一卡通消费流水查询的结构化结果。
export interface CardSpendingFlowToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: CardSpendingFlowData;
    source: "Tongji Open Platform";
    tradeStartTime?: string;
    tradeEndTime?: string;
}
