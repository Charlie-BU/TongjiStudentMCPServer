import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_ORDER_CREATE_TOOL_NAME = "luckin.order.create";
export const registerLuckinOrderCreateTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_ORDER_CREATE_TOOL_NAME,
        title: "创建瑞幸订单",
        description: "创建真实订单。仅在用户确认门店、规格、数量及价格条件且订单预览通过后调用；非空优惠券列表原样传入。超时不得自动重试。仅展示支付二维码 payOrderQrCodeUrl，订单号优先使用字符串 orderIdStr。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.createOrder,
        mutation: true,
        invoke: (client, input) => client.createOrder(input),
    });
};
