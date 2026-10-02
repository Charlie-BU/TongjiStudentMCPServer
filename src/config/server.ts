import { env, loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(__dirname, '../../.env');
if (existsSync(envPath)) loadEnvFile(envPath);

// ServerConfig 表示 MCP 服务的运行配置。
export interface ServerConfig {
  port: number;
  upstreamTimeoutMs: number;
}

// loadUpstreamTimeoutMs 读取单次上游 HTTP 请求超时，未配置时默认 20 秒。
export const loadUpstreamTimeoutMs = (): number => {
  const timeoutMs = Number(env.UPSTREAM_TIMEOUT_MS ?? '20000');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647) {
    throw new Error('UPSTREAM_TIMEOUT_MS must be an integer between 1 and 2147483647');
  }
  return timeoutMs;
};

// loadServerConfig 读取 MCP 服务的运行配置。
export const loadServerConfig = (): ServerConfig => {
  const port = Number(env.APP_PORT ?? '3100');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('APP_PORT must be an integer between 1 and 65535');
  }

  return { port, upstreamTimeoutMs: loadUpstreamTimeoutMs() };
};
