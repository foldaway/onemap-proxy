import assert from "node:assert";
import { Hono } from "hono";
import { env } from "hono/adapter";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { describeRoute, resolver, validator as zValidator } from "hono-openapi";
import z from "zod";
import {
  ONEMAP_CACHE_DO_NAME,
  ONEMAP_ROUTING,
  ROUTING_CACHE_TTL_SECONDS,
} from "../constants";
import { TokenFactory } from "../helpers/TokenFactory";
import { OtherRouteSchema } from "../schema/OtherRoute";
import { PublicTransportRoute } from "../schema/PublicTransportRoute";
import { WGS84PointSchema } from "../schema/WGS84Point";

const querySchema = z
  .object({
    start: WGS84PointSchema,
    end: WGS84PointSchema,
    routeType: z.enum(["walk", "drive", "cycle", "pt"]),
    date: z
      .string()
      .regex(/^\d{2}-\d{2}-\d{4}$/)
      .describe("Date of the selected start point in MM-DD-YYYY.")
      .optional(),
    time: z.iso
      .time({ precision: 0 }) // HH:MM:SS
      .describe(
        "Time of the selected start point in HH:MM:SS, using the 24-hour clock system. HH refers to a zero-padded hour between 00 and 23. MM refers to a zero-padded minute between 00 and 59. SS refers to a zero-padded second between 00 and 59.",
      )
      .optional(),
    mode: z.enum(["transit", "bus", "rail"]).optional(),
    maxWalkDistance: z.coerce
      .number()
      .optional()
      .describe(
        "Optional. The maximum walking distance set by the user in metres.",
      ),
    numItineraries: z.coerce
      .number()
      .min(1)
      .max(3)
      .optional()
      .describe("Optional. Limits the number of return results: 1 to 3."),
  })
  // Add custom refinement to make routeType "pt" mutually exclusive with the others
  .superRefine((val, ctx) => {
    switch (val.routeType) {
      case "pt": {
        if (!val.mode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '"mode" is required for routeType "pt".',
            path: ["mode"],
          });
        }
        if (!val.date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '"date" is required for routeType "pt".',
            path: ["date"],
          });
        }
        if (!val.time) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '"time" is required for routeType "pt".',
            path: ["time"],
          });
        }
        break;
      }
    }
  });
type query = z.infer<typeof querySchema>;

const responseSchema = z.union([PublicTransportRoute, OtherRouteSchema]);
type response = z.infer<typeof responseSchema>;

export const routingRoute = new Hono<{ Bindings: Env }>();
routingRoute.get(
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
    },
  }),
  zValidator("query", querySchema),
  async (c) => {
    const { ONEMAP_CACHE_DO } = env(c);
    const onemapCacheDO = ONEMAP_CACHE_DO.getByName(ONEMAP_CACHE_DO_NAME);
    const cachedData = await onemapCacheDO.getCachedData(
      getCacheKey(c.req.valid("query")),
    );
    if (cachedData != null) {
      const data = cachedData as response;
      if (data.error == null) {
        return c.json(data);
      }
    }

    const query = c.req.valid("query");

    const requestUrl = new URL(ONEMAP_ROUTING);
    switch (query.routeType) {
      case "pt": {
        assert(query.date, "date is required");
        assert(query.time, "time is required");
        assert(query.mode, "mode is required");

        requestUrl.searchParams.set("start", query.start);
        requestUrl.searchParams.set("end", query.end);
        requestUrl.searchParams.set("routeType", "pt");
        requestUrl.searchParams.set("date", query.date);
        requestUrl.searchParams.set("time", query.time);
        requestUrl.searchParams.set("mode", query.mode);
        if (query.maxWalkDistance) {
          requestUrl.searchParams.set(
            "maxWalkDistance",
            query.maxWalkDistance.toString(),
          );
        }
        if (query.numItineraries) {
          requestUrl.searchParams.set(
            "numItineraries",
            query.numItineraries.toString(),
          );
        }
        break;
      }
      default: {
        requestUrl.searchParams.set("start", query.start);
        requestUrl.searchParams.set("end", query.end);
        requestUrl.searchParams.set("routeType", query.routeType);
        break;
      }
    }
    console.log(requestUrl.searchParams.toString());

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
      await onemapCacheDO.setCachedData(getCacheKey(query), data, ROUTING_CACHE_TTL_SECONDS);
    }

    return c.json(data);
  },
);

function getCacheKey(query: query) {
  const parts: string[] = [query.start, query.end, query.routeType];
  switch (query.routeType) {
    case "pt": {
      assert(query.date, "date is required");
      assert(query.time, "time is required");
      assert(query.mode, "mode is required");

      parts.push(query.date);
      parts.push(query.time);
      parts.push(query.mode);

      if (query.maxWalkDistance != null) {
        parts.push(query.maxWalkDistance.toString());
      }
      if (query.numItineraries != null) {
        parts.push(query.numItineraries.toString());
      }
      break;
    }
    default: {
      break;
    }
  }
  return `routing:${parts.join(":")}`;
}
