# onemap-proxy

A Cloudflare Worker that proxies Singapore's [OneMap API](https://www.onemap.gov.sg/apidocs/) with KV-backed caching. Handles OneMap authentication automatically and exposes a Bearer-token-protected API with an OpenAPI reference UI.

## Features

- Proxies OneMap search and routing endpoints
- Caches search API responses in Cloudflare KV for 1 year, routing for 3 months
- Automatically fetches and caches OneMap access tokens (~3 days)
- Bearer token authentication for all proxied endpoints
- OpenAPI 3.0 spec auto-generated at `/openapi.json`
- Interactive API docs (Scalar) served at `/`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/common/elastic/search` | Search for addresses and places |
| `GET` | `/api/public/routingsvc/route` | Get walking, driving, cycling, or public transport routes |
| `GET` | `/openapi.json` | OpenAPI 3.0 spec |
| `GET` | `/` | Interactive API reference (no auth required) |

### Search

```
GET /api/common/elastic/search?searchVal=<keywords>&returnGeom=Y&getAddrDetails=Y&pageNum=1
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `searchVal` | Yes | Keywords to search for |
| `returnGeom` | Yes | `Y` or `N` — include geometry in results |
| `getAddrDetails` | Yes | `Y` or `N` — include address details |
| `pageNum` | No | Page number for paginated results |

### Routing

```
GET /api/public/routingsvc/route?start=<lat,lon>&end=<lat,lon>&routeType=<type>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `start` | Yes | Start point as `latitude,longitude` |
| `end` | Yes | End point as `latitude,longitude` |
| `routeType` | Yes | `walk`, `drive`, `cycle`, or `pt` |
| `date` | Required for `pt` | Date in `MM-DD-YYYY` format |
| `time` | Required for `pt` | Time in `HH:MM:SS` (24-hour) |
| `mode` | Required for `pt` | `transit`, `bus`, or `rail` |
| `maxWalkDistance` | No | Maximum walking distance in metres |
| `numItineraries` | No | Number of results to return (1–3) |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- A [Cloudflare account](https://dash.cloudflare.com/) with Workers and KV access
- A [OneMap account](https://www.onemap.gov.sg/apidocs/) with API credentials

### Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a KV namespace:

   ```sh
   npx wrangler kv namespace create ONEMAP_CACHE
   ```

   Update the `id` in `wrangler.jsonc` with the ID from the output.

3. Create a `.dev.vars` file with your secrets:

   ```sh
   ONEMAP_EMAIL=your@email.com
   ONEMAP_PASSWORD=yourpassword
   API_TOKENS=your-api-token
   ```

   `API_TOKENS` is a comma-separated list of Bearer tokens clients must supply.

4. Start the local dev server:

   ```sh
   npm run dev
   ```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run deploy` | Deploy to Cloudflare |
| `npm test` | Run tests |
| `npm run cf-typegen` | Regenerate TypeScript types from `wrangler.jsonc` bindings |

## Deployment

1. Set production secrets:

   ```sh
   npx wrangler secret put ONEMAP_EMAIL
   npx wrangler secret put ONEMAP_PASSWORD
   npx wrangler secret put API_TOKENS
   ```

2. Deploy:

   ```sh
   npm run deploy
   ```

## Authentication

All proxied endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are configured via the `API_TOKENS` secret (comma-separated for multiple tokens).

## Caching

| Data | TTL |
|------|-----|
| API responses (search, routing) | 7 days |
| OneMap access token | 3 days |

Caching is handled by Cloudflare KV via the `ONEMAP_CACHE` binding.
