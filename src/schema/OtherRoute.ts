import z from "zod";
import { WGS84PointSchema } from "./WGS84Point";

const HeadingSchema = z.enum([
  "North",
  "Northeast",
  "East",
  "Southeast",
  "South",
  "Southwest",
  "West",
  "Northwest",
  "Unknown",
]);

const RouteInstructionLabelSchema = z.enum([
  "Head",
  "Left",
  "Right",
  "Slight Left",
  "Slight Right",
  "Sharp Left",
  "Sharp Right",
  "Destination",
]);

const RouteInstructionSchema = z.tuple([
  RouteInstructionLabelSchema,
  z.string(), // unknown
  z.number(),
  WGS84PointSchema,
  z.number(),
  z
    .string()
    .regex(/^\d+(\.\d+)?m$/)
    .describe("Distance to next instruction in meters"),
  HeadingSchema,
  HeadingSchema,
  z.enum(["walking", "driving", "cycling"]),
  z.string(),
]);

export const OtherRouteSchema = z
  .object({
    error: z.string().optional(),
    status_message: z.string(),
    route_geometry: z.string(),
    status: z.number(),
    route_instructions: z.array(RouteInstructionSchema),
  })
  .meta({
    ref: "OtherRoute",
  });

export type OtherRoute = z.infer<typeof OtherRouteSchema>;
