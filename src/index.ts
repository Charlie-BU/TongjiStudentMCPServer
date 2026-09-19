import { closePostgresPool } from "./storage/postgres";
import { openDatabase } from "./storage/database";
import { loadServerConfig } from './config/server';
import { createHttpServer } from './transport/http';

openDatabase().close();

// config 保存 MCP 服务的运行配置。
const config = loadServerConfig();
// server 保存 MCP 服务的 HTTP 实例。
const server = createHttpServer();

server.listen(config.port, () => {
  console.info(`TongjiStudent MCP Server listening on port ${config.port}`);
});

// 先停止接收请求，待在途调用完成后关闭 PostgreSQL 连接池。
let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    void closePostgresPool().catch(() => {
      console.error("PostgreSQL shutdown failed");
      process.exitCode = 1;
    });
  });
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
