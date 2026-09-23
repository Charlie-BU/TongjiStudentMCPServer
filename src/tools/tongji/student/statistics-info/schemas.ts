import { z } from "zod";

export const STATISTICS_RECORD_SCHEMA = z.object({
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

export const STATISTICS_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的个人统计数据。"),
    data: z.object({
        records: z.array(STATISTICS_RECORD_SCHEMA).describe("个人统计数据记录列表。"),
    }),
    source: z.literal("Tongji Open Platform").describe("统计数据来源。"),
});
