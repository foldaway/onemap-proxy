import { DurableObject } from "cloudflare:workers";

export class OnemapCacheDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS onemap_cache (
        key TEXT PRIMARY KEY NOT NULL,
        data BLOB NOT NULL,
        expires_at TIMESTAMP
      );
    `);
  }

  /**
   * Get the cached data for a given key.
   * @param key - The key to get the cached data for.
   * @returns The cached data.
   */
  async getCachedData(key: string) {
    const result = this.ctx.storage.sql
      .exec(
        `SELECT * FROM onemap_cache WHERE key = ? AND (expires_at IS NULL OR expires_at > CAST(strftime('%s', 'now') AS INTEGER))`,
        key,
      ).toArray();
    if (result.length === 0) {
      return null;
    }
    return JSON.parse(result[0].data as string);
  }

  /**
   * Set the cached data for a given key.
   * @param key - The key to set the cached data for.
   * @param data - The data to set the cached data for.
   * @param ttlSeconds - Seconds until the entry expires (omit for no expiry).
   */
  async setCachedData(key: string, data: unknown, ttlSeconds?: number) {
    const expiresAt =
      ttlSeconds != null
        ? Math.floor(Date.now() / 1000) + ttlSeconds
        : null;
    this.ctx.storage.sql.exec(
      `INSERT INTO onemap_cache (key, data, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at`,
      key,
      JSON.stringify(data),
      expiresAt,
    );
  }

  /**
   * Delete the cached data for a given key.
   * @param key - The key to delete the cached data for.
   */
  async deleteCachedData(key: string) {
    this.ctx.storage.sql.exec(`DELETE FROM onemap_cache WHERE key = ?`, key);
  }
}
