import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDatabase } from "../../src/storage/database";

// 每个测试文件使用独立的真实 SQLite，绝不读写运行库或远端服务。
export const createTestSqlite = () => {
    const directory = mkdtempSync(join(tmpdir(), "mcp-credentials-"));
    const path = join(directory, "mcp.sqlite");
    const originalOpen = openDatabase;
    return { oauthPath: join(directory, "oauth.sqlite"), open: () => originalOpen(path), close: () => rmSync(directory, { recursive: true, force: true }) };
};
