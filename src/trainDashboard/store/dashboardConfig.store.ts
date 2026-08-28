import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    dashboardConfigErrorMessages,
    dashboardConfigSchema,
    type DashboardConfig,
    type Journey,
} from "../dto/dashboardConfig.dto";

const storage = useLocalStorageTyped(
    "train-dashboard-config-v3",
    dashboardConfigSchema,
    {
        version: 3,
        stationGroups: [],
        journeys: [],
        schedules: [],
    }
);

export const useDashboardConfigStore = defineStore("dashboard-config", () => {
    const config = ref<DashboardConfig>(storage.loadFromLocalStorage());

    function saveConfig(candidate: unknown): {
        success: boolean;
        errors: string[];
    } {
        const result = dashboardConfigSchema.safeParse(candidate);

        if (!result.success) {
            return {
                success: false,
                errors: dashboardConfigErrorMessages(result.error),
            };
        }

        config.value = result.data;
        storage.saveToLocalStorage(result.data);

        return {success: true, errors: []};
    }

    function saveStationJourney(
        originCrs: string,
        destinationCrs: string,
        viaCrs?: string
    ): Journey | undefined {
        const existingJourney = config.value.journeys.find(
            (journey) =>
                journey.origin.type === "station" &&
                journey.origin.groupId === undefined &&
                journey.origin.crs === originCrs &&
                journey.destination.type === "station" &&
                journey.destination.groupId === undefined &&
                journey.destination.crs === destinationCrs
        );

        if (existingJourney) {
            return existingJourney;
        }

        const journey: Journey = {
            id: getAvailableJourneyId(originCrs, destinationCrs),
            origin: {type: "station", crs: originCrs},
            destination: {type: "station", crs: destinationCrs},
            viaCrs,
        };
        const result = saveConfig({
            ...config.value,
            journeys: [...config.value.journeys, journey],
        });

        return result.success ? journey : undefined;
    }

    function getAvailableJourneyId(
        originCrs: string,
        destinationCrs: string
    ): string {
        const baseId = `${originCrs}-to-${destinationCrs}`.toLowerCase();
        const existingIds = new Set(
            config.value.journeys.map((journey) => journey.id)
        );
        let id = baseId;
        let suffix = 2;

        while (existingIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
        }

        return id;
    }

    return {config, saveConfig, saveStationJourney};
});
