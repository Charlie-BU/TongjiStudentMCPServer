import type { ToolInvocationContext } from "../../src/auth/types";
// Only business-contract tests inject trusted contexts; HTTP/auth tests exercise real verification.
export interface TestIdentity { accessToken?: string; userId?: string; authentication?: ToolInvocationContext["authentication"] }
export const invocationForTest = (value: TestIdentity): ToolInvocationContext => ({
    ...value, userId: value.userId ?? "", authentication: value.authentication ?? (value.accessToken ? "tongji" : "oauth"),
});
export const TEST_API_KEY = "fixture-api-key-" + "a".repeat(32);
export const SECOND_API_KEY = "fixture-api-key-" + "b".repeat(32);
export const testAuthConfig = { allowedApiKeys: [TEST_API_KEY, SECOND_API_KEY], accessTokenExpireSeconds: 2592000, publicUrl: "http://localhost:3100" };
