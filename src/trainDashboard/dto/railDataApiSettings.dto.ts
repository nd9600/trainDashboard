import {z} from "zod";

export const RailDataApiSettingsSchema = z.object({
    consumerKey: z.string().trim(),
});
export type RailDataApiSettings = z.infer<typeof RailDataApiSettingsSchema>;
