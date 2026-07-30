import {z} from "zod";

export const railDataApiSettingsSchema = z.object({
    consumerKey: z.string().trim(),
});

export type RailDataApiSettings = z.output<typeof railDataApiSettingsSchema>;
