import {z} from "zod";
import {DisplayScheduleSchema} from "./displaySchedule.dto";
import {JourneySchema} from "./journey.dto";
import {StationGroupSchema} from "./stationGroup.dto";

export const DashboardConfigSchema = z.object({
    version: z.literal(3),
    stationGroups: z.array(StationGroupSchema),
    journeys: z.array(JourneySchema),
    schedules: z.array(DisplayScheduleSchema),
});
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
