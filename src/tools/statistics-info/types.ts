export type StatisticsInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

export interface StatisticsRecord {
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

export interface StatisticsInfoData {
    records: StatisticsRecord[];
}

export interface StatisticsInfoToolResult {
    [key: string]: unknown;
    status: StatisticsInfoToolStatus;
    data: StatisticsInfoData;
    source: "Tongji Open Platform";
}
