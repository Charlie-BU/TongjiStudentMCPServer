import { openDatabase } from "./database";

export interface LuckinCredential {
    user_id: string;
    luckin_token: string;
    token_date: number;
    token_timeout: number;
    last_verified_at: number | null;
}

export const readLuckinCredential = (userId: string, path?: string): LuckinCredential | undefined => {
    const db = openDatabase(path);
    try { return db.prepare("SELECT * FROM user_luckin_credentials WHERE user_id = ?").get(userId) as unknown as LuckinCredential | undefined; }
    finally { db.close(); }
};

export const saveLuckinCredential = (userId: string, token: {
    luckyMcpToken: string; luckyMcpTokenDate: number; luckyMcpTokenTimeout: number;
}, path?: string): void => {
    const db = openDatabase(path);
    try {
        db.prepare(`INSERT INTO user_luckin_credentials
            (user_id, luckin_token, token_date, token_timeout, last_verified_at) VALUES (?, ?, ?, ?, NULL)
            ON CONFLICT(user_id) DO UPDATE SET luckin_token=excluded.luckin_token,
            token_date=excluded.token_date, token_timeout=excluded.token_timeout, last_verified_at=NULL`)
            .run(userId, token.luckyMcpToken, token.luckyMcpTokenDate, token.luckyMcpTokenTimeout);
    } finally { db.close(); }
};

// 条件更新防止旧 Token 的探测结果覆盖并发登录刚保存的新 Token。
export const markLuckinVerified = (userId: string, token: string, path?: string): boolean => {
    const db = openDatabase(path);
    try {
        return db.prepare(`UPDATE user_luckin_credentials SET last_verified_at = ?
            WHERE user_id = ? AND luckin_token = ?`).run(Date.now(), userId, token).changes === 1;
    } finally { db.close(); }
};
