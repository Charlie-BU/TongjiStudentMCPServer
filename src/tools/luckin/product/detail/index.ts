import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_PRODUCT_DETAIL_TOOL_NAME = "luckin.product.detail";
export const registerLuckinProductDetailTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_PRODUCT_DETAIL_TOOL_NAME,
        title: "查询瑞幸商品详情",
        description: "获取选定商品的可选规格和属性，不猜测规格 ID。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.queryProductDetailInfo,
        mutation: false,
        invoke: (client, input) => client.queryProductDetailInfo(input),
    });
};
