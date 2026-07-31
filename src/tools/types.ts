// ToolStatus 表示工具的结果状态。
export type ToolStatus =
    | "ok"
    | "empty"
    | "unauthorized"
    | "upstream_unavailable";

// ToolErrorStatus 表示与 "ok"/"empty" 互斥的错误状态。
export type ToolErrorStatus = Exclude<ToolStatus, "ok" | "empty">;
