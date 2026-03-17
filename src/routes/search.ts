import { Hono } from "hono";
import { env } from "hono/adapter";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { describeRoute, resolver, validator as zValidator } from "hono-openapi";
import z from "zod";
import {
  ONEMAP_CACHE_DO_NAME,
  ONEMAP_ELASTIC_SEARCH,
  SEARCH_CACHE_TTL_SECONDS,
} from "../constants";
import { TokenFactory } from "../helpers/TokenFactory";

const querySchema = z.object({
  searchVal: z
    .string()
    .describe("Keywords entered by users to filter the results"),
  returnGeom: z
    .enum(["Y", "N"])
    .describe(
      "Values: Y, N . Enter Y if user wants the geometry value returned.",
    ),
  getAddrDetails: z
    .enum(["Y", "N"])
    .describe(
      "Values: Y, N . Enter Y if user wants the address details returned.",
    ),
  pageNum: z.coerce
    .number()
    .optional()
    .describe("Optional. Specifies the page to retrieve search results."),
});
type query = z.infer<typeof querySchema>;

const responseSchema = z.object({
  error: z.string().optional(),
  found: z.number(),
  totalNumPages: z.number(),
  pageNum: z.number(),
  results: z.array(
    z.object({
      SEARCHVAL: z.string(),
      BLK_NO: z.string(),
      ROAD_NAME: z.string(),
      BUILDING: z.string(),
      ADDRESS: z.string(),
      POSTAL: z.string(),
      X: z.string(),
      Y: z.string(),
      LATITUDE: z.string(),
      LONGITUDE: z.string(),
      LONGTITUDE: z.string(),
    }),
  ),
});
type response = z.infer<typeof responseSchema>;

export const searchRoute = new Hono<{ Bindings: Env }>();
searchRoute.get(
  "/",
  describeRoute({
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: resolver(responseSchema),
          },
        },
      },
      400: { description: "Invalid parameters" },
      403: { description: "Forbidden" },
      429: { description: "Too many requests" },
    },
  }),
  zValidator("query", querySchema),
  async (c) => {
    const query = c.req.valid("query");
    const { searchVal, returnGeom, getAddrDetails, pageNum } = query;

    const { ONEMAP_CACHE_DO } = env(c);
    const onemapCacheDO = ONEMAP_CACHE_DO.getByName(ONEMAP_CACHE_DO_NAME);
    const cachedData = await onemapCacheDO.getCachedData(getCacheKey(query));
    if (cachedData != null) {
      const data = cachedData as response;
      if (data.error == null) {
        return c.json(data);
      }
    }

    const requestUrl = new URL(ONEMAP_ELASTIC_SEARCH);
    requestUrl.searchParams.set("searchVal", searchVal);
    requestUrl.searchParams.set("returnGeom", returnGeom);
    requestUrl.searchParams.set("getAddrDetails", getAddrDetails);
    if (pageNum != null) {
      requestUrl.searchParams.set("pageNum", pageNum.toString());
    }

    const token = await TokenFactory.getToken(env(c));
    const response = await fetch(requestUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json(await response.json(), {
        status: response.status as ContentfulStatusCode,
      });
    }

    const data: response = await response.json();
    if (data.error == null) {
      await onemapCacheDO.setCachedData(
        getCacheKey(query),
        data,
        SEARCH_CACHE_TTL_SECONDS,
      );
    }

    return c.json(data);
  },
);

function getCacheKey(query: query) {
  const parts: string[] = [
    query.searchVal,
    query.returnGeom,
    query.getAddrDetails,
  ];
  if (query.pageNum != null) {
    parts.push(query.pageNum.toString());
  }
  return `search:${parts.join(":")}`;
}
