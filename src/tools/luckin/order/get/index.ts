import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_ORDER_GET_TOOL_NAME = "luckin.order.get";
export const registerLuckinOrderGetTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_ORDER_GET_TOOL_NAME,
        title: "查询瑞幸订单",
        description: "查询用户指定订单的支付状态与取餐信息。orderId 必须为字符串，只有查询确认已支付后才展示取餐码。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.queryOrderDetailInfo,
        mutation: false,
        invoke: (client, input) => client.queryOrderDetailInfo(input),
    });
};
