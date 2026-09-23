import {getNewJourneyId, getLocationKey} from "../journeys/journeyIdentity";
import {z} from "zod";
import {
    JourneyFieldsSchema,
    JourneySchema,
    type JourneyFields,
    type Journey,
    type LocationReference,
} from "./journey.dto";
const EphemeralJourneyFieldsSchema = JourneyFieldsSchema.refine(
    (journey) => getLocationKey(journey.origin) !== getLocationKey(journey.destination)
);
export type EphemeralJourney = Journey;

export const JourneyMemorySchema = z.object({
    recentJourneyIds: z.array(z.string().min(1)).max(50),
    ephemeralJourneys: z.array(JourneySchema),
});

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
        id: getNewJourneyId(
            `${getLocationId(result.data.origin)}-to-${getLocationId(result.data.destination)}`.toLowerCase(),
            existingJourneyIds
        ),
        ...result.data,
    };
}

function getLocationId(location: LocationReference): string {
    return location.type === "group" ? location.groupId : location.crs;
}
