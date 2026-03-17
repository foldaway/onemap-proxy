import { ONEMAP_CACHE_DO_NAME, ONEMAP_GET_TOKEN, TOKEN_CACHE_TTL_SECONDS } from "../constants";

export const TokenFactory = {
  /**
   * Get a token from the cache or fetch a new one if it doesn't exist.
   * @param env - The environment variables.
   * @returns The token.
   */
  async getToken(env: Env): Promise<string> {
    const { ONEMAP_CACHE_DO } = env;
    const onemapCacheDO = ONEMAP_CACHE_DO.getByName(ONEMAP_CACHE_DO_NAME);
    const cached = await onemapCacheDO.getCachedData("token");
    if (cached) return cached;

    if (!env.ONEMAP_EMAIL || !env.ONEMAP_PASSWORD) {
      throw new Error(
        "Set ONEMAP_TOKEN or ONEMAP_EMAIL + ONEMAP_PASSWORD secrets",
      );
    }

    const res = await fetch(ONEMAP_GET_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: env.ONEMAP_EMAIL,
        password: env.ONEMAP_PASSWORD,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OneMap auth failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { access_token?: string };
    const token = data.access_token;
    if (!token) throw new Error("OneMap auth: no access_token in response");

    await onemapCacheDO.setCachedData("token", token, TOKEN_CACHE_TTL_SECONDS);

    return token;
  },
};
