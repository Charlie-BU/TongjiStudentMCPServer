import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { newDb } from "pg-mem";

// 执行交付给部署者的同一份 SQL；离线测试不会访问 .env 指向的真实数据库。
export const createTestPostgres = () => {
    const database = newDb();
    database.public.none(readFileSync(resolve(__dirname, "../../sql/user_luckin_credentials.sql"), "utf8"));
    return new (database.adapters.createPg().Pool)();
};
