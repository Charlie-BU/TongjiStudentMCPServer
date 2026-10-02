import { openDatabase } from "./database";

export interface LuckinCredential {
    user_id: string;
    is_from_tongji: boolean;
    luckin_token: string;
    token_date: number;
    token_timeout: number;
    last_verified_at: number | null;
}

export const readLuckinCredential = async (userId: string): Promise<LuckinCredential | undefined> => {
    const db = openDatabase();
    try {
        const row = db.prepare("SELECT user_id, is_from_tongji, luckin_token, token_date, token_timeout, last_verified_at FROM user_luckin_credentials WHERE user_id = ?").get(userId);
        if (!row) return undefined;
        return { user_id: String(row.user_id), is_from_tongji: row.is_from_tongji === 1,
            luckin_token: String(row.luckin_token), token_date: Number(row.token_date),
            token_timeout: Number(row.token_timeout), last_verified_at: row.last_verified_at === null ? null : Number(row.last_verified_at) };
    } finally { db.close(); }
};

export const saveLuckinCredential = async (userId: string, token: {
    luckyMcpToken: string; luckyMcpTokenDate: number; luckyMcpTokenTimeout: number;
}, isFromTongji: boolean): Promise<void> => {
    const db = openDatabase();
    try {
        // 单条语句自动提交；写入完成后调用方才可报告登录成功。
        db.prepare(`INSERT INTO user_luckin_credentials
            (user_id, is_from_tongji, luckin_token, token_date, token_timeout, last_verified_at) VALUES (?, ?, ?, ?, ?, NULL)
            ON CONFLICT(user_id) DO UPDATE SET is_from_tongji=excluded.is_from_tongji,
            luckin_token=excluded.luckin_token, token_date=excluded.token_date,
            token_timeout=excluded.token_timeout, last_verified_at=NULL`).run(
                userId, isFromTongji ? 1 : 0, token.luckyMcpToken, token.luckyMcpTokenDate, token.luckyMcpTokenTimeout);
    } finally { db.close(); }
};

// 条件更新防止旧 Token 的探测结果覆盖并发登录保存的新 Token。
export const markLuckinVerified = async (userId: string, token: string): Promise<boolean> => {
    const db = openDatabase();
    try {
        const result = db.prepare("UPDATE user_luckin_credentials SET last_verified_at = ? WHERE user_id = ? AND luckin_token = ?").run(Date.now(), userId, token);
        return result.changes === 1;
    } finally { db.close(); }
};
