import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sendLuckinSMSCode } from "../../../../integration/luckin_coffee/auth";
import { LUCKIN_SMS_INPUT_SCHEMA, LUCKIN_SMS_DATA_SCHEMA } from "../../../../integration/luckin_coffee/contract";
import { createLuckinOutputSchema, runLuckinAction } from "../../result";

export const LUCKIN_SEND_SMS_CODE_TOOL_NAME = "luckin.auth.send_sms_code";

export const registerLuckinSendSMSCodeTool = (server: McpServer): void => {
    server.registerTool(LUCKIN_SEND_SMS_CODE_TOOL_NAME, {
        title: "发送瑞幸登录验证码",
        description: "向用户指定手机号发送瑞幸登录短信。仅在用户要求登录并同意发送验证码时调用，不能自动重试。不需要同济凭据或瑞幸登录 Cookie；CSRF 由服务端管理。",
        inputSchema: LUCKIN_SMS_INPUT_SCHEMA,
        outputSchema: createLuckinOutputSchema(LUCKIN_SMS_DATA_SCHEMA),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input) => runLuckinAction(() => sendLuckinSMSCode(input)));
};
