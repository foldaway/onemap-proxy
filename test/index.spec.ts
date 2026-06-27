import {
  createExecutionContext,
  env,
  SELF,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("API reference", () => {
  it("serves Scalar with the proxy title", async () => {
    const request = new IncomingRequest("http://example.com");
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"title": "Foldaway OneMap Proxy"');
  });

  it("publishes OpenAPI metadata for Scalar", async () => {
    const response = await SELF.fetch("https://example.com/openapi.json");
    const openapi = await response.json<{
      info: { title: string; description: string; version: string };
    }>();

    expect(response.status).toBe(200);
    expect(openapi.info).toMatchObject({
      title: "Foldaway OneMap Proxy",
      description:
        "Bearer-token-protected proxy for OneMap search and routing endpoints, with Foldaway-managed authentication and response caching.",
      version: "1.0.0",
    });
  });
});
