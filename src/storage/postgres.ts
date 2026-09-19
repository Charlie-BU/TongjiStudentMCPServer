import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { Pool } from "pg";

// 从仓库根目录加载，兼容 src/ 与 dist/；部署环境中显式设置的变量优先。
const envPath = resolve(__dirname, "../../.env");
if (existsSync(envPath)) loadEnvFile(envPath);

let pool: Pool | undefined;
export const getPostgresPool = (): Pool => {
    if (!pool) {
        const connectionString = process.env.POSTGRES_DSN?.trim();
        if (!connectionString) throw new Error("POSTGRES_DSN is required");
        pool = new Pool({
            connectionString, max: 10, connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000, statement_timeout: 5000,
        });
        // 空闲连接错误不能成为未处理事件，也不输出含连接信息的原始错误。
        pool.on("error", () => console.error("PostgreSQL idle connection unavailable"));
    }
    return pool;
};

export const closePostgresPool = async (): Promise<void> => {
    const current = pool;
    pool = undefined;
    await current?.end();
};
