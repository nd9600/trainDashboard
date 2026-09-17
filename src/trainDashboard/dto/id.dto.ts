import {z} from "zod";

export const IdSchema = z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export function newId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
