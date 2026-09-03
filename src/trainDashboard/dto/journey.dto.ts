import {z} from "zod";
import {IdSchema} from "./id.dto";
import {CrsCodeSchema} from "./station.dto";

const LocationGroupIdSchema = z
    .string()
    .min(1, "Choose a station or group.")
    .pipe(IdSchema);

export const LocationReferenceSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("station"),
        groupId: LocationGroupIdSchema.optional(),
        crs: CrsCodeSchema,
    }),
    z.object({
        type: z.literal("group"),
        groupId: LocationGroupIdSchema,
    }),
]);
export type LocationReference = z.infer<typeof LocationReferenceSchema>;

export const JourneyFieldsSchema = z.object({
    origin: LocationReferenceSchema,
    destination: LocationReferenceSchema,
    viaCrs: CrsCodeSchema.optional(),
});
export type JourneyFields = z.infer<typeof JourneyFieldsSchema>;

export const JourneySchema = JourneyFieldsSchema.extend({id: IdSchema});
export type Journey = z.infer<typeof JourneySchema>;
