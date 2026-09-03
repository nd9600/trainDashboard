import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    dashboardConfigErrorMessages,
    DashboardConfigSchema,
    type DashboardConfig,
    type Journey,
} from "../dto/dashboardConfig.dto";

const storage = useLocalStorageTyped(
    "train-dashboard-config-v3",
    DashboardConfigSchema,
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
        const result = DashboardConfigSchema.safeParse(candidate);

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

    function saveJourney(candidate: Journey): Journey | undefined {
        const existingJourney = config.value.journeys.find(
            (journey) =>
                journey.origin.type === "station" &&
                journey.origin.groupId === undefined &&
                candidate.origin.type === "station" &&
                journey.origin.crs === candidate.origin.crs &&
                journey.destination.type === "station" &&
                journey.destination.groupId === undefined &&
                candidate.destination.type === "station" &&
                journey.destination.crs === candidate.destination.crs
        );

        if (existingJourney) {
            return existingJourney;
        }

        const journey: Journey = {
            ...candidate,
            id: getAvailableJourneyId(candidate.id),
        };
        const result = saveConfig({
            ...config.value,
            journeys: [...config.value.journeys, journey],
        });

        return result.success ? journey : undefined;
    }

    function updateJourney(candidate: Journey): void {
        if (
            config.value.schedules.some(
                (schedule) => schedule.journeyId === candidate.id
            ) ||
            !config.value.journeys.some(
                (journey) => journey.id === candidate.id
            )
        ) {
            return;
        }

        saveConfig({
            ...config.value,
            journeys: config.value.journeys.map((journey) =>
                journey.id === candidate.id ? candidate : journey
            ),
        });
    }

    function removeJourney(journeyId: string): boolean {
        if (
            !config.value.journeys.some(
                (journey) => journey.id === journeyId
            ) ||
            config.value.schedules.some(
                (schedule) => schedule.journeyId === journeyId
            )
        ) {
            return false;
        }

        return saveConfig({
            ...config.value,
            journeys: config.value.journeys.filter(
                (journey) => journey.id !== journeyId
            ),
        }).success;
    }

    function getAvailableJourneyId(baseId: string): string {
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

    return {
        config,
        saveConfig,
        saveJourney,
        updateJourney,
        removeJourney,
    };
});
