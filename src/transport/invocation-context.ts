import type { IncomingHttpHeaders } from "node:http";

// ToolInvocationContext 定义了工具调用上下文的结构，包含 accessToken 和用户 ID。
export interface ToolInvocationContext {
  accessToken?: string;
  userId?: string;
}

// normalizeInvocation 规范化工具调用上下文，确保 accessToken 和用户 ID 是有效的。
export const normalizeInvocation = (invocation: ToolInvocationContext): ToolInvocationContext => {
  const accessToken = invocation.accessToken?.trim();
  const userId = invocation.userId?.trim();
  // Reject batch identities and ambiguous/duplicate headers.
  return accessToken && /^[A-Za-z0-9._~+\/=-]+$/.test(accessToken)
    && userId && /^[A-Za-z0-9_-]+$/.test(userId) ? { accessToken, userId } : {};
};

// readToolInvocationContext 从 HTTP 请求头中读取工具调用上下文。
export const readToolInvocationContext = (headers: IncomingHttpHeaders): ToolInvocationContext =>
  normalizeInvocation({
    accessToken: typeof headers["x-tongji-access-token"] === "string" ? headers["x-tongji-access-token"] : undefined,
    userId: typeof headers["x-tongji-user-id"] === "string" ? headers["x-tongji-user-id"] : undefined,
  });

// validateServiceCredential 通过 getUserBasicInfo API 验证服务凭证是否有效。
export const validateServiceCredential = async (invocation: ToolInvocationContext): Promise<boolean> => {
  if (!invocation.accessToken || !invocation.userId) return false;
  try {
    const { getUserBasicInfo } = await import("../integration/tongji_openapi");
    const result = await getUserBasicInfo({ accessToken: invocation.accessToken, userId: "00001" }) as {
      code?: string; data?: { list?: { userId?: string; name?: string; userTypeName?: string }[] };
    };
    const service = result?.data?.list?.[0];
    return result?.code === "A00000" && service?.userId === "00001"
      && service.name === "李建中" && service.userTypeName === "教职工";
  } catch { return false; }
};
