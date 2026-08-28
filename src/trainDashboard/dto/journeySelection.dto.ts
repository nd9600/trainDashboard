import {z} from "zod";
import {
    crsCodeSchema,
    journeyFieldsSchema,
    journeySchema,
    type Journey,
    type JourneyFields,
} from "./dashboardConfig.dto";

const stationLocationSchema = z.object({
    type: z.literal("station"),
    crs: crsCodeSchema,
});

const ephemeralJourneyFieldsSchema = journeyFieldsSchema
    .extend({
        origin: stationLocationSchema,
        destination: stationLocationSchema,
    })
    .refine((journey) => journey.origin.crs !== journey.destination.crs);

const ephemeralJourneySchema = journeySchema.extend({
    origin: stationLocationSchema,
    destination: stationLocationSchema,
});
type StationJourney = z.output<typeof ephemeralJourneySchema>;

export const journeyMemorySchema = z.object({
    recentJourneyIds: z.array(z.string().min(1)).max(50),
    ephemeralJourneys: z.array(ephemeralJourneySchema),
});

export type JourneyMemory = z.output<typeof journeyMemorySchema>;

export type ActiveJourney =
    | {type: "predicted"}
    | {type: "saved"; id: string}
    | {type: "ephemeral"; id: string};

export interface JourneyChoiceGroup {
    name: "Predicted" | "Recent" | "Saved";
    journeys: Journey[];
}

export function createEphemeralJourney(
    fields: JourneyFields,
    existingJourneyIds: Iterable<string> = []
): StationJourney | undefined {
    const result = ephemeralJourneyFieldsSchema.safeParse(fields);

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

function getAvailableJourneyId(
    baseId: string,
    existingJourneyIds: Iterable<string>
): string {
    const existingIds = new Set(existingJourneyIds);
    let id = baseId;
    let suffix = 2;

    while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
    }

    return id;
}
