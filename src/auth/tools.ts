import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL_NAMES, toolPolicy } from "./tool-policy";
import { AuthenticationError, type ToolInvocationContext } from "./types";

export const authorizeTool = (name: string, invocation: ToolInvocationContext): void => {
    const policy = toolPolicy(name);
    if (!invocation.userId?.trim() || !["tongji", "oauth", "api_key"].includes(invocation.authentication)) {
        throw new AuthenticationError(401, "authentication_required", "缺少已认证的用户身份。");
    }
    if (invocation.authentication === "tongji" && !invocation.accessToken?.trim()) {
        throw new AuthenticationError(401, "invalid_service_credential", "缺少同济服务凭据。");
    }
    if (policy === "tongji" && (invocation.authentication !== "tongji" || !invocation.accessToken?.trim())) {
        throw new AuthenticationError(403, "tongji_identity_required", "此工具要求同济身份认证。");
    }
};

// 为通过返回的代理注册的工具统一包装权限检查，确保非 HTTP 调用也执行工具权限策略。
// invocation 应由入口认证后提供；这里只判断工具访问权限，不重新验证 Token 真伪。
// 调用方用返回的 server 注册全部工具，再调用 check() 校验权限表与注册结果是否完整对应。
export const withToolAuthorization = (server: McpServer, invocation: ToolInvocationContext): { server: McpServer; check: () => void } => {
    // 记录本次装配实际注册的工具，用于检查重名和漏注册。
    const registered = new Set<string>();
    // 保存原始注册方法并绑定真实实例，包装后的回调最终仍交给 MCP SDK 注册。
    const register = server.registerTool.bind(server);
    const proxy = new Proxy(server, { get(target, property) {
        if (property !== "registerTool") {
            // 其他属性直接透传；方法绑定真实实例，避免 this 指向代理影响 SDK 内部状态访问。
            const value = Reflect.get(target, property);
            return typeof value === "function" ? value.bind(target) : value;
        }
        // 只拦截 registerTool，保留原工具名称、配置以及业务回调的参数和返回值类型。
        return (...[name, config, callback]: Parameters<McpServer["registerTool"]>) => {
            // 注册时先检查策略是否存在，禁止未声明权限的工具进入服务。
            toolPolicy(name);
            if (registered.has(name)) throw new Error(`Duplicate tool: ${name}`);
            registered.add(name);
            const invoke = callback as (...args: unknown[]) => ReturnType<typeof callback>;
            return register(name, config, async (...args: unknown[]) => {
                // 每次执行业务前检查本次服务实例绑定的身份；失败时不进入原业务回调。
                try { authorizeTool(name, invocation); }
                catch (error) {
                    // 将已知权限错误转为 MCP 工具错误结果；其他异常继续抛出，避免掩盖程序错误。
                    if (!(error instanceof AuthenticationError)) throw error;
                    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ status: "unauthorized", message: error.message }) }] };
                }
                return invoke(...args);
            });
        };
    }});
    return { server: proxy, check: () => {
        // 反向检查：权限表中的每个工具都必须已注册，防止新增策略后遗漏工具装配。
        for (const name of TOOL_NAMES) if (!registered.has(name)) throw new Error(`Configured tool is not registered: ${name}`);
    }};
};
