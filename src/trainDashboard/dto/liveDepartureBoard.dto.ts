import {z} from "zod";

const ApiTimeSchema = z.string();

const CallingPointSchema = z.object({
    locationName: z.string().optional(),
    crs: z.string(),
    st: ApiTimeSchema,
    et: ApiTimeSchema.nullish(),
    isCancelled: z.boolean().optional(),
});

const CallingPointListSchema = z.object({
    callingPoint: z.array(CallingPointSchema),
    serviceType: z.enum(["train", "bus", "ferry"]).optional(),
    serviceChangeRequired: z.boolean().optional(),
    assocIsCancelled: z.boolean().optional(),
});

const DepartureServiceSchema = z.object({
    std: ApiTimeSchema,
    etd: ApiTimeSchema.nullish(),
    platform: z.string().nullish(),
    isCancelled: z.boolean().optional(),
    serviceID: z.string(),
    subsequentCallingPoints: z
        .array(CallingPointListSchema)
        .nullish()
        .transform((callingPoints) => callingPoints ?? []),
});
export type DepartureService = z.infer<typeof DepartureServiceSchema>;

export const DepartureBoardSchema = z.object({
    generatedAt: z.string().nullish(),
    locationName: z.string().nullish(),
    crs: z.string(),
    filterLocationName: z.string().nullish(),
    filtercrs: z.string().nullish(),
    platformAvailable: z.boolean().optional(),
    areServicesAvailable: z.boolean().optional(),
    trainServices: z
        .array(DepartureServiceSchema)
        .nullish()
        .transform((services) => services ?? []),
});
export type DepartureBoard = z.infer<typeof DepartureBoardSchema>;
