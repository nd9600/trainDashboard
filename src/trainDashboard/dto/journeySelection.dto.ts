import {z} from "zod";
import {
    crsCodeSchema,
    journeyFieldsSchema,
    type Journey,
    type JourneyFields,
} from "./dashboardConfig.dto";

const stationLocationSchema = z.object({
    type: z.literal("station"),
    crs: crsCodeSchema,
});

export const ephemeralJourneySchema = journeyFieldsSchema
    .extend({
        type: z.literal("ephemeral"),
        origin: stationLocationSchema,
        destination: stationLocationSchema,
    })
    .transform((journey) => ({
        ...journey,
        id: getEphemeralJourneyId(journey.origin.crs, journey.destination.crs),
    }));

export type EphemeralJourney = z.output<typeof ephemeralJourneySchema>;
export type JourneySelection = Journey | EphemeralJourney;

export function createEphemeralJourney(
    journey: JourneyFields
): EphemeralJourney | undefined {
    const result = ephemeralJourneySchema.safeParse({
        type: "ephemeral",
        ...journey,
    });

    if (
        !result.success ||
        result.data.origin.crs === result.data.destination.crs
    ) {
        return undefined;
    }

    return result.data;
}

export function isEphemeralJourney(
    journey: JourneySelection | undefined
): journey is EphemeralJourney {
    return (
        journey !== undefined &&
        "type" in journey &&
        journey.type === "ephemeral"
    );
}

function getEphemeralJourneyId(
    originCrs: string,
    destinationCrs: string
): string {
    return `ephemeral:${originCrs}-${destinationCrs}`;
}
