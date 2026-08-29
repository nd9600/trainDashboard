import {z} from "zod";
import {
    CrsCodeSchema,
    JourneyFieldsSchema,
    JourneySchema,
    type Journey,
    type JourneyFields,
} from "./dashboardConfig.dto";

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
    | {type: "ephemeral"; id: string};

export interface JourneyChoiceGroup {
    name: "Predicted" | "Recent" | "Saved";
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
