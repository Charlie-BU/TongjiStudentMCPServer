import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from "../src/server";

async function main() {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: { authentication: "api_key", userId: "catalog-export" } });
    const client = new Client({ name: "catalog-export", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        const { tools } = await client.listTools();
        const source = (name: string) => name.startsWith("luckin.") ? "Luckin Coffee" : name.includes("legacy-teacher") ? "Local SQLite" : name.startsWith("tongji.course.") ? "YourTJ" : "Tongji Open Platform";
        const lines = ["# Tongji Student MCP Tool Catalog", "", `> 从 MCP tools/list 导出。服务：${SERVER_NAME}，版本：${SERVER_VERSION}。`, `> 当前注册 **${tools.length}** 个工具。运行 \`pnpm docs:tools\` 可重新生成。`, "", "## 通用约定", "",
            "- 校园个人工具要求 X-User-Id 和 X-Tongji-Access-Token；工具参数不能提供或覆盖身份。",
            "- 鉴权与全量工具两类策略集中在 src/auth；同济路径验证服务 Token 并透传非空 X-User-Id，校验失败不回退。",
            "- 不要求同济身份的工具也必须认证：同济认证，或 Authorization: Bearer <OAuth access_token/API Key>。外部路径忽略 X-User-Id，以已验证 Bearer 构造内部用户 ID。",
            "- OAuth 授权页以配置的 API Key 确认授权；仅签发 access_token，不支持 refresh_token。重新授权产生新身份。",
            "- 同济工具的正常结果使用 status/data/source；错误使用 isError 和脱敏 status/message。瑞幸 check 使用 valid/message。",
            "- 更新联系方式为写操作，不自动重试。调用前须有用户明确的操作意图。",
            "- CAM 接口覆盖、分页与兼容说明见 [同济 API 迁移](TONGJI_API.md)。", "", "## 工具目录", "", "| Tool | 标题 | 数据源 |", "| --- | --- | --- |",
            ...tools.map(tool => `| \`${tool.name}\` | ${tool.title ?? ""} | ${source(tool.name)} |`), ""];
        for (const tool of tools) {
            lines.push(`## ${tool.name}`, "", tool.description ?? "", "", "### Input Schema", "", "```json", JSON.stringify(tool.inputSchema, null, 2), "```", "");
            if (tool.outputSchema) lines.push("### Output Schema", "", "```json", JSON.stringify(tool.outputSchema, null, 2), "```", "");
            if (tool.annotations) lines.push("### Annotations", "", "```json", JSON.stringify(tool.annotations, null, 2), "```", "");
        }
        await writeFile(resolve(__dirname, "../docs/TOOLS.md"), lines.join("\n"));
        console.log(`Exported ${tools.length} tool contracts.`);
    } finally { await client.close(); await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
