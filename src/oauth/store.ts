import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { digest } from "../auth/authenticate";

import { DATA_DIRECTORY } from "../config/storage";

export const OAUTH_DATABASE_PATH = resolve(DATA_DIRECTORY, "oauth.sqlite");
// Identifiers (including bearer secrets and codes) are hashed before persistence.
export class OAuthStore {
    constructor(public readonly path = OAUTH_DATABASE_PATH, private readonly now = Date.now) {
        mkdirSync(dirname(path), { recursive: true });
        const db = new DatabaseSync(path);
        try {
            db.exec("PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS oauth_entries (kind TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, expires INTEGER, PRIMARY KEY(kind,id));");
        } finally { db.close(); }
        chmodSync(path, 0o600);
    }
    transaction<T>(operation: (db: DatabaseSync) => T): T {
        const db = new DatabaseSync(this.path);
        try {
            db.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
            const value = operation(db);
            db.exec("COMMIT");
            return value;
        } catch (error) { db.exec("ROLLBACK"); throw error; }
        finally { db.close(); }
    }
    put(db: DatabaseSync, kind: string, id: string, body: unknown, lifetime: number | null): void {
        db.prepare("DELETE FROM oauth_entries WHERE expires <= ?").run(this.now());
        db.prepare("INSERT OR REPLACE INTO oauth_entries VALUES (?,?,?,?)").run(kind, digest(id), JSON.stringify(body), lifetime === null ? null : this.now() + lifetime * 1000);
    }
    get<T>(db: DatabaseSync, kind: string, id: string, consume = false): T | undefined {
        const query = consume
            ? "DELETE FROM oauth_entries WHERE kind=? AND id=? AND (expires IS NULL OR expires>?) RETURNING body"
            : "SELECT body FROM oauth_entries WHERE kind=? AND id=? AND (expires IS NULL OR expires>?)";
        const row = db.prepare(query).get(kind, digest(id), this.now());
        return row ? JSON.parse(String(row.body)) as T : undefined;
    }
    read<T>(kind: string, id: string): T | undefined {
        return this.transaction(db => this.get<T>(db, kind, id));
    }
}
