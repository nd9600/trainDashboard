import {z} from "zod";

export const journeyHistoryEntrySchema = z.object({
    journeyId: z.string().min(1),
    selectedAt: z.iso.datetime(),
});

export const journeyHistorySchema = z.array(journeyHistoryEntrySchema).max(50);

export type JourneyHistoryEntry = z.output<typeof journeyHistoryEntrySchema>;
