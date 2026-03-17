export const ONEMAP_BASE = "https://www.onemap.gov.sg/";
export const ONEMAP_REVGEOCODE = `${ONEMAP_BASE}/privateapi/commonsvc/revgeocode`;
export const ONEMAP_REVGEOCODEXY = `${ONEMAP_BASE}/privateapi/commonsvc/revgeocodexy`;
export const ONEMAP_GET_TOKEN = `${ONEMAP_BASE}/api/auth/post/getToken`;
export const ONEMAP_ELASTIC_SEARCH = `${ONEMAP_BASE}/api/common/elastic/search`;
export const ONEMAP_ROUTING = `${ONEMAP_BASE}/api/public/routingsvc/route`;

/** Cache search API responses for 1 year (addresses rarely change) */
export const SEARCH_CACHE_TTL_SECONDS = 60 * 60 * 24 * 365;
/** Cache routing API responses for 3 months (routes may change with roadworks, etc.) */
export const ROUTING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 90;
/** Token cached for ~3 days (OneMap token TTL) */
export const TOKEN_CACHE_TTL_SECONDS = 60 * 60 * 24 * 3;

/** Name of the Durable Object for caching OneMap API responses */
export const ONEMAP_CACHE_DO_NAME = "ONEMAP_CACHE_DO";
