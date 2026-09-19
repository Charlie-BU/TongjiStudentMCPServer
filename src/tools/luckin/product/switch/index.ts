import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolRegistrationContext } from "../../../registry";
import { registerLuckinBusinessTool } from "../../business";
import { LUCKIN_MCP_ARGUMENT_SCHEMAS } from "../../../../integration/luckin_coffee/contract";

export const LUCKIN_PRODUCT_SWITCH_TOOL_NAME = "luckin.product.switch";
export const registerLuckinProductSwitchTool = (server: McpServer, context: ToolRegistrationContext): void => {
    registerLuckinBusinessTool(server, context, {
        name: LUCKIN_PRODUCT_SWITCH_TOOL_NAME,
        title: "切换瑞幸商品规格",
        description: "根据商品详情提供的属性切换目标 SKU。此操作不创建订单。",
        schema: LUCKIN_MCP_ARGUMENT_SCHEMAS.switchProduct,
        mutation: false,
        invoke: (client, input) => client.switchProduct(input),
    });
};
