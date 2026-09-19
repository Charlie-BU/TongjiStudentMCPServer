import { getPostgresPool } from "./postgres";

export interface LuckinCredential {
    user_id: string;
    luckin_token: string;
    token_date: number;
    token_timeout: number;
    last_verified_at: number | null;
}

// pg 默认把 BIGINT 返回为字符串；保持原有凭据接口为安全整数，不更改全局类型解析器。
const integer = (value: string | number): number => {
    const result = Number(value);
    if (!Number.isSafeInteger(result)) throw new Error("Invalid credential timestamp");
    return result;
};
export const readLuckinCredential = async (userId: string): Promise<LuckinCredential | undefined> => {
    const { rows } = await getPostgresPool().query(
        "SELECT user_id, luckin_token, token_date, token_timeout, last_verified_at FROM public.user_luckin_credentials WHERE user_id = $1", [userId]);
    const row = rows[0];
    if (!row) return undefined;
    return { user_id: row.user_id, luckin_token: row.luckin_token,
        token_date: integer(row.token_date), token_timeout: integer(row.token_timeout),
        last_verified_at: row.last_verified_at === null ? null : integer(row.last_verified_at) };
};

export const saveLuckinCredential = async (userId: string, token: {
    luckyMcpToken: string; luckyMcpTokenDate: number; luckyMcpTokenTimeout: number;
}): Promise<void> => {
    // 单条语句自动提交；调用方必须 await 完成后才能报告登录成功。
    await getPostgresPool().query(`INSERT INTO public.user_luckin_credentials
        (user_id, luckin_token, token_date, token_timeout, last_verified_at) VALUES ($1, $2, $3, $4, NULL)
        ON CONFLICT(user_id) DO UPDATE SET luckin_token=EXCLUDED.luckin_token,
        token_date=EXCLUDED.token_date, token_timeout=EXCLUDED.token_timeout, last_verified_at=NULL`,
        [userId, token.luckyMcpToken, token.luckyMcpTokenDate, token.luckyMcpTokenTimeout]);
};

// 条件更新防止旧 Token 的探测结果覆盖并发登录刚保存的新 Token。
export const markLuckinVerified = async (userId: string, token: string): Promise<boolean> => {
    const result = await getPostgresPool().query(`UPDATE public.user_luckin_credentials SET last_verified_at = $1
        WHERE user_id = $2 AND luckin_token = $3`, [Date.now(), userId, token]);
    return result.rowCount === 1;
};
