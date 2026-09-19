-- 在 POSTGRES_DSN 指向的数据库中，以 MCP 连接账号执行。
-- 若由其他账号建表，须另行授予 MCP 账号 SELECT、INSERT、UPDATE 权限。
-- 可重复执行；不覆盖已有凭据，也不迁移旧 SQLite Token。
CREATE TABLE IF NOT EXISTS public.user_luckin_credentials (
    user_id TEXT PRIMARY KEY,
    luckin_token TEXT NOT NULL,
    -- 保留瑞幸返回的原始整数，不推测单位或进行换算。
    token_date BIGINT NOT NULL,
    token_timeout BIGINT NOT NULL,
    -- 最近一次成功验证的 Unix 毫秒时间；新登录尚未验证时为 NULL。
    last_verified_at BIGINT
);
