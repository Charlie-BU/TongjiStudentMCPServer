import { ToolStatus } from "../types";

// CompetitionPrize 表示单条本科生竞赛奖励记录。
export interface CompetitionPrize {
    awardCategory: string | null;
    awardDate: string | null;
    awardLevel: string | null;
    competitionLevel: string | null;
    competitionName: string | null;
    deptName: string | null;
    name: string | null;
    schoolYear: string | null;
}

// CompetitionPrizeData 表示本科生竞赛奖励记录的脱敏业务数据。
export interface CompetitionPrizeData {
    list: CompetitionPrize[];
}

// CompetitionPrizeToolResult 表示本科生竞赛奖励查询的结构化结果。
export interface CompetitionPrizeToolResult {
    [key: string]: unknown;
    status: ToolStatus;
    data: CompetitionPrizeData;
    source: "Tongji Open Platform";
}
