import {z} from "zod";

const apiTimeSchema = z.string();

const callingPointSchema = z.object({
    locationName: z.string().optional(),
    crs: z.string(),
    st: apiTimeSchema,
    et: apiTimeSchema.nullish(),
    isCancelled: z.boolean().optional(),
});

const callingPointListSchema = z.object({
    callingPoint: z.array(callingPointSchema),
    serviceType: z.enum(["train", "bus", "ferry"]).optional(),
    serviceChangeRequired: z.boolean().optional(),
    assocIsCancelled: z.boolean().optional(),
});

const departureServiceSchema = z.object({
    std: apiTimeSchema,
    etd: apiTimeSchema.nullish(),
    platform: z.string().nullish(),
    isCancelled: z.boolean().optional(),
    serviceID: z.string(),
    subsequentCallingPoints: z
        .array(callingPointListSchema)
        .nullish()
        .transform((callingPoints) => callingPoints ?? []),
});

export const departureBoardSchema = z.object({
    generatedAt: z.string().nullish(),
    locationName: z.string().nullish(),
    crs: z.string(),
    filterLocationName: z.string().nullish(),
    filtercrs: z.string().nullish(),
    platformAvailable: z.boolean().optional(),
    areServicesAvailable: z.boolean().optional(),
    trainServices: z
        .array(departureServiceSchema)
        .nullish()
        .transform((services) => services ?? []),
});

export type DepartureBoard = z.output<typeof departureBoardSchema>;
export type DepartureService = z.output<typeof departureServiceSchema>;
