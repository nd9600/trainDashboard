import {
    dashboardConfigSchema,
    type DashboardConfig,
} from "../dto/dashboardConfig.dto";

export const defaultDashboardConfig: DashboardConfig =
    dashboardConfigSchema.parse({
        version: 1,
        groups: [
            {
                id: "home",
                name: "Home",
                stations: [
                    {crs: "ANL", walkMinutes: 15},
                    {crs: "KVD", walkMinutes: 5},
                ],
            },
            {
                id: "work",
                name: "Work",
                stations: [
                    {crs: "CHC", walkMinutes: 8},
                    {crs: "EXG", walkMinutes: 15},
                ],
            },
            {
                id: "glasgow",
                name: "Glasgow",
                stations: [{crs: "GLQ"}, {crs: "GLC"}],
            },
        ],
        pairs: [
            {
                id: "home-to-work",
                origin: {
                    type: "station",
                    groupId: "home",
                    crs: "ANL",
                },
                destination: {type: "group", groupId: "work"},
            },
            {
                id: "work-to-home",
                origin: {type: "group", groupId: "work"},
                destination: {
                    type: "station",
                    groupId: "home",
                    crs: "ANL",
                },
            },
            {
                id: "home-to-glasgow",
                origin: {type: "group", groupId: "home"},
                destination: {type: "group", groupId: "glasgow"},
            },
            {
                id: "glasgow-to-home",
                origin: {type: "group", groupId: "glasgow"},
                destination: {type: "group", groupId: "home"},
            },
        ],
        schedules: [
            {
                id: "weekday-morning",
                name: "Weekday morning",
                days: [1, 2, 3, 4, 5],
                startsAt: "00:00",
                endsAt: "12:00",
                primaryPairIds: ["home-to-work"],
                secondaryPairIds: ["home-to-glasgow"],
            },
            {
                id: "weekday-afternoon",
                name: "Weekday afternoon",
                days: [1, 2, 3, 4, 5],
                startsAt: "12:00",
                endsAt: "24:00",
                primaryPairIds: ["work-to-home"],
                secondaryPairIds: ["glasgow-to-home"],
            },
            {
                id: "weekend",
                name: "Weekend travel",
                days: [0, 6],
                startsAt: "00:00",
                endsAt: "24:00",
                primaryPairIds: ["home-to-glasgow"],
                secondaryPairIds: [],
            },
        ],
    });
