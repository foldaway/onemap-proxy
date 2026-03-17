/**
 * OneMap API proxy with KV caching.
 *
 * Proxies requests to Singapore's OneMap API and caches responses in KV.
 * Requires ONEMAP_EMAIL + ONEMAP_PASSWORD (or ONEMAP_TOKEN) as secrets.
 *
 * Usage:
 *   GET /revgeocode?location=lat,lon
 *   GET /revgeocodexy?location=x,y
 */

import { createHono } from "./hono";

const hono = createHono();

export { OnemapCacheDurableObject } from "./durable-object";

export default {
  fetch: hono.fetch,
} satisfies ExportedHandler<Env>;
