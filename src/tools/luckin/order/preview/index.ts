import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_ORDER_PREVIEW_TOOL_NAME = "luckin.order.preview";
export const registerLuckinOrderPreviewTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_ORDER_PREVIEW_TOOL_NAME,
        title: "预览瑞幸订单",
        description: "预览指定门店商品的价格和优惠。创建前必须预览，保留返回的 couponCodeList。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.previewOrder,
        mutation: false,
        invoke: (client, input) => client.previewOrder(input),
    });
};
