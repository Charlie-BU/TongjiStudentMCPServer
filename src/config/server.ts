import { env } from 'node:process';

// ServerConfig 表示 MCP 服务的运行配置。
export interface ServerConfig {
  host: string;
  port: number;
}

// loadServerConfig 读取 MCP 服务的运行配置。
export const loadServerConfig = (): ServerConfig => {
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return { host: env.HOST ?? '127.0.0.1', port };
};
