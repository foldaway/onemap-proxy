import z from "zod";

export const WGS84PointSchema = z
  .string({})
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  .meta({
    ref: "WGS84Point",
    description: "The point in WGS84 latitude, longitude format",
  });
export type WGS84Point = z.infer<typeof WGS84PointSchema>;
