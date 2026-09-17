import {getAvailableJourneyId} from "../journeys/journeyIdentity";
import {z} from "zod";
import {JourneyFieldsSchema, JourneySchema, type JourneyFields, type Journey} from "./journey.dto";
import {CrsCodeSchema} from "./station.dto";

const StationLocationSchema = z.object({
    type: z.literal("station"),
    crs: CrsCodeSchema,
});

const EphemeralJourneyFieldsSchema = JourneyFieldsSchema.extend({
    origin: StationLocationSchema,
    destination: StationLocationSchema,
}).refine((journey) => journey.origin.crs !== journey.destination.crs);

const EphemeralJourneySchema = JourneySchema.extend({
    origin: StationLocationSchema,
    destination: StationLocationSchema,
});
export type EphemeralJourney = z.infer<typeof EphemeralJourneySchema>;

export const JourneyMemorySchema = z.object({
    recentJourneyIds: z.array(z.string().min(1)).max(50),
    ephemeralJourneys: z.array(EphemeralJourneySchema),
});
export type JourneyMemory = z.infer<typeof JourneyMemorySchema>;

export type ActiveJourney =
    | {type: "predicted"}
    | {type: "saved"; id: string}
    | {type: "ephemeral"; journey: EphemeralJourney};

export interface JourneyChoices {
    name: "Predicted" | "Alternatives" | "Recent" | "Saved";
    journeys: Journey[];
}

export function createEphemeralJourney(
    fields: JourneyFields,
    existingJourneyIds: Iterable<string> = []
): EphemeralJourney | undefined {
    const result = EphemeralJourneyFieldsSchema.safeParse(fields);

    if (!result.success) {
        return undefined;
    }

    return {
        id: getAvailableJourneyId(
            `${result.data.origin.crs}-to-${result.data.destination.crs}`.toLowerCase(),
            existingJourneyIds
        ),
        ...result.data,
    };
}
