import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { routingRoute } from "./routes/routing";
import { searchRoute } from "./routes/search";

/**
 * Create a Hono instance with the routes and middleware.
 * @returns A Hono instance.
 */
export function createHono() {
  const hono = new Hono<{ Bindings: Env }>();
  hono.onError((err, c) => {
    console.error(err);
    if (err instanceof HTTPException) {
      console.error(err.cause);
      // Get the custom response
      return err.getResponse();
    }
    return c.json(
      { error: "Internal server error", message: err.message },
      500,
    );
  });

  hono.use(logger());
  hono.use("*", async (c, next) => {
    const { API_TOKENS } = env(c);
    const authMiddleware = bearerAuth({
      token: API_TOKENS.split(","),
    });
    const path = c.req.path;
    if (path.startsWith("/openapi") || path === "/") {
      // Skip auth for openapi and docs
      return next();
    }

    return authMiddleware(c, next);
  });

  hono.route("/api/common/elastic/search", searchRoute);
  hono.route("/api/public/routingsvc/route", routingRoute);
  hono.get(
    "/openapi.json",
    openAPIRouteHandler(hono, {
      documentation: {
        info: {
          title: "OneMap API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    }),
  );

  hono.get(
    "/",
    Scalar({
      title: "OneMap API",
      url: "/openapi.json",
    }),
  );

  return hono;
}
