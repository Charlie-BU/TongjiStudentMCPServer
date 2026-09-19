import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_PRODUCT_SEARCH_TOOL_NAME = "luckin.product.search";
export const registerLuckinProductSearchTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_PRODUCT_SEARCH_TOOL_NAME,
        title: "搜索瑞幸商品",
        description: "在用户选定的门店搜索商品。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.searchProductForMcp,
        mutation: false,
        invoke: (client, input) => client.searchProductForMcp(input),
    });
};
