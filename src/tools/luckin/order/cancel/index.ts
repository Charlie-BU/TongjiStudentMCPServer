import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_ORDER_CANCEL_TOOL_NAME = "luckin.order.cancel";
export const registerLuckinOrderCancelTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_ORDER_CANCEL_TOOL_NAME,
        title: "取消瑞幸订单",
        description: "取消用户明确要求取消的订单，orderId 必须为字符串。操作结果不明时先查单，不直接重复取消。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.cancelOrder,
        mutation: true,
        invoke: (client, input) => client.cancelOrder(input),
    });
};
