export interface ToolInvocationContext {
    userId: string;
    authentication: "tongji" | "oauth" | "api_key";
    accessToken?: string;
}
export class AuthenticationError extends Error {
    constructor(public readonly status: 400 | 401 | 403, public readonly code: string, message: string) {
        super(message);
    }
}
