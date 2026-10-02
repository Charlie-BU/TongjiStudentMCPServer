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

// 停止接收请求并等待在途调用完成；SQLite 连接在每次读写后关闭。
let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
