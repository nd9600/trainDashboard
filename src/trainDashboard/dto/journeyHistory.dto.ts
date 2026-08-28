import {z} from "zod";
import {ephemeralJourneySchema} from "./journeySelection.dto";

const savedJourneyHistoryEntrySchema = z.object({
    type: z.literal("saved").default("saved"),
    journeyId: z.string().min(1),
    selectedAt: z.iso.datetime(),
});

const ephemeralJourneyHistoryEntrySchema = z.object({
    type: z.literal("ephemeral"),
    journey: ephemeralJourneySchema,
    selectedAt: z.iso.datetime(),
});

export const journeyHistoryEntrySchema = z.union([
    savedJourneyHistoryEntrySchema,
    ephemeralJourneyHistoryEntrySchema,
]);

export const journeyHistorySchema = z.array(journeyHistoryEntrySchema).max(50);

export type JourneyHistoryEntry = z.output<typeof journeyHistoryEntrySchema>;
