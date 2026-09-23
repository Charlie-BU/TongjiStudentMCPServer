import { z } from "zod";

export const STATISTICS_RECORD_SCHEMA = z.object({
    bookCategory: z.string().nullable().describe("最喜欢的主题"),
    bookCoun: z.number().nullable().describe("借了X本书"),
    bookFirst: z.string().nullable().describe("借阅的第一本书"),
    canteenAmount: z.number().nullable().describe("食堂总消费"),
    canteenAmtPercentileRank: z.number().nullable().describe("超过X%的同济人（用总消费算）"),
    canteenCoun: z.number().nullable().describe("在食堂累计消费X次"),
    canteenOften: z.string().nullable().describe("对X食堂情有独钟"),
    canteenOftenPercentileRank: z.number().nullable().describe("属于你X%的美味时光在此度过"),
    cardPelaceCoun: z.number().nullable().describe("补卡次数"),
    college: z.string().nullable().describe("学院 所属学院，已由上游做脱敏处理。"),
    consumMostAmount: z.number().nullable().describe("这一天一共花了￥ 元"),
    consumMostTime: z.string().nullable().describe("最大的一笔消费发生在 年 月 日"),
    consumePlaceOften: z.string().nullable().describe("你最常光顾X（即最多次的消费场所）"),
    consumeTotal: z.number().nullable().describe("累计消费￥ 元（所有消费）"),
    consumeTotalPercentileRank: z.number().nullable().describe("超过了 %的同济人（所有消费）"),
    earlistTime: z.string().nullable().describe("最早进入图书馆的时间（精确到秒）"),
    entYear: z.number().nullable().describe("X年你离开了家"),
    entranceCoun: z.number().nullable().describe("去了X次图书馆"),
    firstCardPlaceTime: z.string().nullable().describe("第一次补卡时间"),
    gender: z.string().nullable().describe("性别"),
    latestTime: z.string().nullable().describe("最晚离开图书馆的时间（精确到秒）"),
    major: z.string().nullable().describe("专业 专业名称，已由上游做脱敏处理。"),
    marketAmount: z.number().nullable().describe("在超市共消费了 元"),
    rechargeTimeSlot: z.string().nullable().describe("你最喜欢在X时间段进行充值,以2小时为间隔，依次类推"),
    rideCoun: z.number().nullable().describe("乘坐校车在校区之间往返 次"),
    scholarshipCoun: z.number().nullable().describe("获得奖学金 次"),
    sname: z.string().nullable().describe("姓名 学生姓名，已由上游做脱敏处理，不可用于身份验证。"),
    stayTime: z.number().nullable().describe("在馆一共 小时"),
    stayTimePercentileRank: z.number().nullable().describe("超过了 %的同济人"),
    stayYear: z.number().nullable().describe("开启了属于你的X年济忆时光（本研在同济的所有年头）"),
    stuLevel: z.string().nullable().describe("学历:0->本;1->硕;2->博;9->师"),
    userId: z.string().nullable().describe("学工号 学工号，已由上游做脱敏处理，不可用于身份验证。"),
});

export const STATISTICS_INFO_OUTPUT_SCHEMA = z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态，empty 表示没有可返回的个人统计数据。"),
    data: z.object({
        records: z.array(STATISTICS_RECORD_SCHEMA).describe("个人统计数据记录列表。"),
    }).describe("业务响应数据。"),
    source: z.literal("Tongji Open Platform").describe("统计数据来源。"),
});
