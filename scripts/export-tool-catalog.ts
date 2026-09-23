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
            "- 个人工具只使用 Agent 请求头中的服务 token 和 userId，二者必须成对提供；工具参数不能提供或覆盖身份。",
            "- 框架在 HTTP 入口验证服务凭据，用户身份取自 X-Tongji-User-Id，不能从服务账号推断。",
            "- YourTJ 公开课程、本地历史评价及瑞幸短信验证码工具可匿名调用；个人校园数据和瑞幸账号工具要求可信身份。",
            "- 同济工具的正常结果使用 status/data/source；错误使用 isError 和脱敏 status/message。瑞幸 check 使用 valid/message。",
            "- 更新联系方式、创建会议为写操作，不自动重试。调用前须有用户明确的操作意图。",
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
