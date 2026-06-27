# onemap-proxy

A Cloudflare Worker that proxies Singapore's [OneMap API](https://www.onemap.gov.sg/apidocs/) search and routing endpoints. It handles OneMap authentication automatically, caches successful upstream responses in a SQLite-backed Durable Object, and exposes Bearer-token-protected proxy endpoints with a public OpenAPI reference UI.

> [!IMPORTANT]
> This repository supports Foldaway's internal use of OneMap data. It is not intended to provide a public hosted API, and the deployed Worker should not be treated as a shared third-party service.
>
> External users who need similar functionality are encouraged to fork this repository and deploy their own Cloudflare Worker with their own Cloudflare and OneMap credentials.

## Features

- Proxies OneMap search and routing endpoints
- Caches successful search responses for 1 year and routing responses for 90 days
- Automatically fetches and caches OneMap access tokens for 3 days
- Stores cached data in the `OnemapCacheDurableObject` Durable Object
- Requires Bearer token authentication for proxied endpoints
- Generates an OpenAPI 3.0 spec at `/openapi.json`
- Serves an interactive Scalar API reference at `/`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/common/elastic/search` | Required | Search for addresses and places |
| `GET` | `/api/public/routingsvc/route` | Required | Get walking, driving, cycling, or public transport routes |
| `GET` | `/openapi.json` | Not required | OpenAPI 3.0 spec |
| `GET` | `/` | Not required | Interactive API reference |

### Search

```http
GET /api/common/elastic/search?searchVal=<keywords>&returnGeom=Y&getAddrDetails=Y&pageNum=1
Authorization: Bearer <token>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `searchVal` | Yes | Keywords to search for |
| `returnGeom` | Yes | `Y` or `N`; include geometry in results |
| `getAddrDetails` | Yes | `Y` or `N`; include address details |
| `pageNum` | No | Page number for paginated results |

### Routing

```http
GET /api/public/routingsvc/route?start=<lat,lon>&end=<lat,lon>&routeType=<type>
Authorization: Bearer <token>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `start` | Yes | Start point as `latitude,longitude` |
| `end` | Yes | End point as `latitude,longitude` |
| `routeType` | Yes | `walk`, `drive`, `cycle`, or `pt` |
| `date` | Required for `pt` | Date in `MM-DD-YYYY` format |
| `time` | Required for `pt` | Time in `HH:MM:SS` 24-hour format |
| `mode` | Required for `pt` | `transit`, `bus`, or `rail` |
| `maxWalkDistance` | No | Maximum walking distance in metres |
| `numItineraries` | No | Number of results to return, from 1 to 3 |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- A [Cloudflare account](https://dash.cloudflare.com/) with Workers and Durable Objects access
- A [OneMap account](https://www.onemap.gov.sg/apidocs/) with API credentials

### Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local secrets file:

   ```sh
   cp .dev.vars.example .dev.vars
   ```

3. Fill in `.dev.vars`:

   ```sh
   ONEMAP_EMAIL=your@email.com
   ONEMAP_PASSWORD=yourpassword
   API_TOKENS=your-api-token
   ```

   `API_TOKENS` is a comma-separated list of Bearer tokens that clients may use.

4. Start the local dev server:

   ```sh
   npm run dev
   ```

The Durable Object binding and migration are already configured in `wrangler.jsonc`; no KV namespace setup is required.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local Wrangler development server |
| `npm start` | Alias for `npm run dev` |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm test` | Run the Vitest Worker test suite |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` |

Run `npm run cf-typegen` after changing Worker bindings or compatibility settings in `wrangler.jsonc`.

## Deployment

1. Log in to Cloudflare if needed:

   ```sh
   npx wrangler login
   ```

2. Set production secrets:

   ```sh
   npx wrangler secret put ONEMAP_EMAIL
   npx wrangler secret put ONEMAP_PASSWORD
   npx wrangler secret put API_TOKENS
   ```

3. Deploy:

   ```sh
   npm run deploy
   ```

The first deployment applies the Durable Object migration in `wrangler.jsonc` for `OnemapCacheDurableObject`.

## Authentication

All proxied endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

Tokens are configured through the `API_TOKENS` secret. Use comma-separated values to allow multiple client tokens.

## Caching

| Data | TTL | Cache key source |
|------|-----|------------------|
| Search responses | 1 year | Search query parameters |
| Routing responses | 90 days | Routing query parameters |
| OneMap access token | 3 days | Shared `token` key |

Caching is handled by the `ONEMAP_CACHE_DO` Durable Object binding. Cached rows are stored in the Durable Object's SQLite storage and are ignored after their `expires_at` timestamp.

Only successful OneMap responses without an `error` field are cached.
