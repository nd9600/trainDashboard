import {z} from "zod";

export const RailDataApiSettingsSchema = z.object({
    consumerKey: z
        .string()
        .regex(/^[A-Za-z0-9]*$/, "Use only letters A–Z, a–z and numbers 0–9 in the Consumer key."),
});
export type RailDataApiSettings = z.infer<typeof RailDataApiSettingsSchema>;
