import {
    dashboardConfigSchema,
    type DashboardConfig,
} from "../dto/dashboardConfig.dto";

export const manchesterDashboardConfig: DashboardConfig =
    dashboardConfigSchema.parse({
        version: 3,
        stationGroups: [
            {
                id: "heaton-chapel",
                name: "Heaton Chapel",
                stations: [
                    {crs: "HTC", walkMinutes: 15},
                    {crs: "BNA", walkMinutes: 5},
                ],
            },
            {
                id: "manchester-piccadilly",
                name: "Manchester Piccadilly",
                stations: [
                    {crs: "EDY", walkMinutes: 8},
                    {crs: "MAN", walkMinutes: 15},
                ],
            },
            {
                id: "liverpool",
                name: "Liverpool",
                stations: [{crs: "LIV"}],
            },
        ],
        journeys: [
            {
                id: "heaton-chapel-to-manchester-piccadilly",
                origin: {
                    type: "station",
                    groupId: "heaton-chapel",
                    crs: "HTC",
                },
                destination: {type: "group", groupId: "manchester-piccadilly"},
            },
            {
                id: "manchester-piccadilly-to-heaton-chapel",
                origin: {type: "group", groupId: "manchester-piccadilly"},
                destination: {
                    type: "station",
                    groupId: "heaton-chapel",
                    crs: "HTC",
                },
            },
            {
                id: "heaton-chapel-to-liverpool",
                origin: {type: "group", groupId: "heaton-chapel"},
                destination: {type: "group", groupId: "liverpool"},
            },
            {
                id: "liverpool-to-heaton-chapel",
                origin: {type: "group", groupId: "liverpool"},
                destination: {type: "group", groupId: "heaton-chapel"},
            },
        ],
        schedules: [
            {
                id: "weekday-morning",
                name: "Weekday morning",
                days: [1, 2, 3, 4, 5],
                startsAt: "00:00",
                endsAt: "12:00",
                journeyId: "heaton-chapel-to-manchester-piccadilly",
            },
            {
                id: "weekday-afternoon",
                name: "Weekday afternoon",
                days: [1, 2, 3, 4, 5],
                startsAt: "12:00",
                endsAt: "24:00",
                journeyId: "manchester-piccadilly-to-heaton-chapel",
            },
            {
                id: "weekend",
                name: "Weekend travel",
                days: [0, 6],
                startsAt: "00:00",
                endsAt: "24:00",
                journeyId: "heaton-chapel-to-liverpool",
            },
        ],
    });
