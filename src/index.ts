import { loadServerConfig } from './config/server';
import { createHttpServer } from './transport/http';

// config 保存 MCP 服务的运行配置。
const config = loadServerConfig();
// server 保存 MCP 服务的 HTTP 实例。
const server = createHttpServer(config);

server.listen(config.port, config.host, () => {
  console.info(`TongjiStudent MCP Server listening on http://${config.host}:${config.port}/mcp`);
});
