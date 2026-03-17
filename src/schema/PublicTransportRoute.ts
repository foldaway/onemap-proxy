import * as z from "zod";

const VertexTypeSchema = z.enum(["NORMAL", "TRANSIT"]);
type VertexType = z.infer<typeof VertexTypeSchema>;

const TransitRouterTimesSchema = z.object({
  tripPatternFilterTime: z.number(),
  accessEgressTime: z.number(),
  raptorSearchTime: z.number(),
  itineraryCreationTime: z.number(),
});
type TransitRouterTimes = z.infer<typeof TransitRouterTimesSchema>;

const ElevationMetadataSchema = z.object({
  ellipsoidToGeoidDifference: z.number(),
  geoidElevation: z.boolean(),
});
type ElevationMetadata = z.infer<typeof ElevationMetadataSchema>;

const MetadataSchema = z.object({
  searchWindowUsed: z.number(),
  nextDateTime: z.number(),
  prevDateTime: z.number(),
});
type Metadata = z.infer<typeof MetadataSchema>;

const PlanFromSchema = z.object({
  name: z.string(),
  lon: z.number(),
  lat: z.number(),
  vertexType: VertexTypeSchema,
});
type PlanFrom = z.infer<typeof PlanFromSchema>;

const IntermediateStopClassSchema = z.object({
  name: z.string(),
  lon: z.number(),
  lat: z.number(),
  departure: z.number().optional(),
  vertexType: VertexTypeSchema,
  stopId: z.string().optional(),
  stopCode: z.string().optional(),
  arrival: z.number().optional(),
  stopIndex: z.number().optional(),
  stopSequence: z.number().optional(),
});
type IntermediateStopClass = z.infer<typeof IntermediateStopClassSchema>;

const LegGeometrySchema = z.object({
  points: z.string(),
  length: z.number(),
});
type LegGeometry = z.infer<typeof LegGeometrySchema>;

const StepSchema = z.object({
  distance: z.number(),
  relativeDirection: z.string(),
  streetName: z.string(),
  absoluteDirection: z.string(),
  stayOn: z.boolean(),
  area: z.boolean(),
  bogusName: z.boolean(),
  lon: z.number(),
  lat: z.number(),
  elevation: z.string(),
  walkingBike: z.boolean(),
});
type Step = z.infer<typeof StepSchema>;

const RequestParametersSchema = z.object({
  mode: z.string(),
  date: z.string(),
  arriveBy: z.string(),
  showIntermediateStops: z.string(),
  fromPlace: z.string(),
  transferPenalty: z.string(),
  toPlace: z.string(),
  time: z.string(),
  maxTransfers: z.string(),
  numItineraries: z.string(),
});
type RequestParameters = z.infer<typeof RequestParametersSchema>;

const DebugOutputSchema = z.object({
  precalculationTime: z.number(),
  directStreetRouterTime: z.number(),
  transitRouterTime: z.number(),
  filteringTime: z.number(),
  renderingTime: z.number(),
  totalTime: z.number(),
  transitRouterTimes: TransitRouterTimesSchema,
});
type DebugOutput = z.infer<typeof DebugOutputSchema>;

const LegSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  departureDelay: z.number(),
  arrivalDelay: z.number(),
  realTime: z.boolean(),
  distance: z.number(),
  generalizedCost: z.number(),
  pathway: z.boolean(),
  mode: z.string(),
  transitLeg: z.boolean(),
  route: z.string(),
  agencyTimeZoneOffset: z.number(),
  interlineWithPreviousLeg: z.boolean(),
  from: IntermediateStopClassSchema,
  to: IntermediateStopClassSchema,
  legGeometry: LegGeometrySchema,
  steps: z.array(StepSchema),
  rentedBike: z.boolean().optional(),
  walkingBike: z.boolean().optional(),
  duration: z.number(),
  agencyName: z.string().optional(),
  agencyUrl: z.string().optional(),
  routeType: z.number().optional(),
  routeId: z.string().optional(),
  agencyId: z.string().optional(),
  tripId: z.string().optional(),
  serviceDate: z.string().optional(),
  intermediateStops: z.array(IntermediateStopClassSchema).optional(),
  routeShortName: z.string().optional(),
  routeLongName: z.string().optional(),
});
type Leg = z.infer<typeof LegSchema>;

const ItinerarySchema = z.object({
  duration: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  walkTime: z.number(),
  transitTime: z.number(),
  waitingTime: z.number(),
  walkDistance: z.number(),
  walkLimitExceeded: z.boolean(),
  generalizedCost: z.number(),
  elevationLost: z.number(),
  elevationGained: z.number(),
  transfers: z.number(),
  fare: z.string(),
  legs: z.array(LegSchema),
  tooSloped: z.boolean(),
  arrivedAtDestinationWithRentedBicycle: z.boolean(),
});
type Itinerary = z.infer<typeof ItinerarySchema>;

const PlanSchema = z.object({
  date: z.number(),
  from: PlanFromSchema,
  to: PlanFromSchema,
  itineraries: z.array(ItinerarySchema),
});
type Plan = z.infer<typeof PlanSchema>;

export const PublicTransportRoute = z
  .object({
    error: z.string().optional(),
    requestParameters: RequestParametersSchema,
    plan: PlanSchema,
    metadata: MetadataSchema,
    previousPageCursor: z.string(),
    nextPageCursor: z.string(),
    debugOutput: DebugOutputSchema,
    elevationMetadata: ElevationMetadataSchema,
  })
  .meta({
    ref: "PublicTransportRoute",
  });
export type Welcome = z.infer<typeof PublicTransportRoute>;
