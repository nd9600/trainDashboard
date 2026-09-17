import {getAvailableJourneyId, hasSameJourneyFields} from "../journeys/journeyIdentity";
import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {DashboardConfigSchema, type DashboardConfig} from "../dto/dashboardConfig.dto";
import type {Journey} from "../dto/journey.dto";

const storage = useLocalStorageTyped("train-dashboard-config-v3", DashboardConfigSchema, {
    version: 3,
    shouldUseLocation: true,
    stationGroups: [],
    journeys: [],
    schedules: [],
});

export const useDashboardConfigStore = defineStore("dashboard-config", () => {
    const config = ref<DashboardConfig>(storage.loadFromLocalStorage());

    function saveConfig(candidate: DashboardConfig): void {
        config.value = candidate;
        storage.saveToLocalStorage(candidate);
    }

    function setShouldUseLocation(shouldUseLocation: boolean): void {
        saveConfig({...config.value, shouldUseLocation});
    }

    function saveJourney(candidate: Journey): Journey {
        const existingJourney = config.value.journeys.find((journey) =>
            hasSameJourneyFields(journey, candidate)
        );

        if (existingJourney) {
            return existingJourney;
        }

        const journey: Journey = {
            ...candidate,
            id: getAvailableJourneyId(
                candidate.id,
                config.value.journeys.map((journey) => journey.id)
            ),
        };
        saveConfig({
            ...config.value,
            journeys: [...config.value.journeys, journey],
        });

        return journey;
    }

    function updateJourney(candidate: Journey): void {
        if (
            config.value.schedules.some((schedule) => schedule.journeyId === candidate.id) ||
            !config.value.journeys.some((journey) => journey.id === candidate.id)
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
            !config.value.journeys.some((journey) => journey.id === journeyId) ||
            config.value.schedules.some((schedule) => schedule.journeyId === journeyId)
        ) {
            return false;
        }

        saveConfig({
            ...config.value,
            journeys: config.value.journeys.filter((journey) => journey.id !== journeyId),
        });

        return true;
    }

    return {
        config,
        saveConfig,
        setShouldUseLocation,
        saveJourney,
        updateJourney,
        removeJourney,
    };
});
