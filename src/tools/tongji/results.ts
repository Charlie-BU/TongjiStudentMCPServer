import axios from "axios";
import { z } from "zod";
import { YourtjResponseError } from "../../integration/yourtj";
import { createErrorResult } from "../utils";

// createYourtjOutputSchema 定义课程工具的统一 MCP 响应包装。
export const createYourtjOutputSchema = <S extends z.AnyZodObject>(data: S) => z.object({
    status: z.enum(["ok", "empty"]).describe("查询状态；empty 表示成功但当前没有可展示数据。"),
    data,
    source: z.literal("YourTJ").describe("课程数据来源。"),
});

// runYourtjQuery 将已校验的课程结果或上游错误转换为 MCP 响应。
export const runYourtjQuery = async <D extends Record<string, unknown>>(
    label: string,
    query: () => Promise<D>,
    isEmpty: (data: D) => boolean,
) => {
    try {
        const data = await query();
        const result = { status: isEmpty(data) ? "empty" as const : "ok" as const, data, source: "YourTJ" as const };
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
    } catch (error) {
        let message = `YourTJ ${label}服务暂时不可用，请稍后重试。`;
        if (error instanceof YourtjResponseError) {
            message = error.reason === "invalidParams"
                ? "课程查询参数无效，请检查课程 ID、筛选条件或分页参数。"
                : `YourTJ ${label}服务返回异常，请稍后重试。`;
        } else if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 400) message = "课程查询参数无效，请检查课程 ID、筛选条件或分页参数。";
            if (status === 404) message = "未找到指定课程或接口，请检查课程 ID。";
            if (status === 429) message = "YourTJ 请求过于频繁，请稍后重试。";
            if (status === 401 || status === 403) message = `YourTJ ${label}服务拒绝访问，请稍后重试。`;
        }
        return createErrorResult("upstream_unavailable", message);
    }
};
