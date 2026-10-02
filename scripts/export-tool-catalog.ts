import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from "../src/server";

async function main() {
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer({ invocation: {} });
    const client = new Client({ name: "catalog-export", version: "1" });
    try {
        await server.connect(st);
        await client.connect(ct);
        const { tools } = await client.listTools();
        const source = (name: string) => name.startsWith("luckin.") ? "Luckin Coffee" : name.includes("legacy-teacher") ? "Local SQLite" : name.startsWith("tongji.course.") ? "YourTJ" : "Tongji Open Platform";
        const lines = ["# Tongji Student MCP Tool Catalog", "", `> 从 MCP tools/list 导出。服务：${SERVER_NAME}，版本：${SERVER_VERSION}。`, `> 当前注册 **${tools.length}** 个工具。运行 \`pnpm docs:tools\` 可重新生成。`, "", "## 通用约定", "",
            "- 校园个人工具要求 X-User-Id 和 X-Tongji-Access-Token；工具参数不能提供或覆盖身份。",
            "- 所有 MCP 请求携带同济 Token 时均在 HTTP 入口验证服务凭据，失败返回 403；瑞幸无需携带同济 Token，用户身份取自 X-User-Id。",
            "- YourTJ 公开课程和本地历史评价无需身份；全部瑞幸工具必须携带 X-User-Id，同济 Token 可选。凭据保存至本地 SQLite，登录时按是否携带同济 Token 记录 is_from_tongji。",
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
