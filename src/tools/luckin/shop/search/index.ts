import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_SHOP_SEARCH_TOOL_NAME = "luckin.shop.search";
export const registerLuckinShopSearchTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_SHOP_SEARCH_TOOL_NAME,
        title: "查询瑞幸门店",
        description: "按经纬度及可选门店名查询门店。经纬度必须来自用户提供或授权的位置。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.queryShopList,
        mutation: false,
        invoke: (client, input) => client.queryShopList(input),
    });
};
