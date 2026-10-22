import {getNewJourneyId, journeysAreTheSame} from "../journeys/journeyIdentity";
import {defineStore} from "pinia";
import {ref, watch} from "vue";
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

    watch(
        () => config.value.shouldUseLocation,
        () => storage.saveToLocalStorage(config.value),
        {flush: "sync"}
    );

    function saveConfig(candidate: DashboardConfig): void {
        config.value = candidate;
        storage.saveToLocalStorage(candidate);
    }

    function saveJourney(candidate: Journey): Journey {
        const existingJourney = config.value.journeys.find((journey) =>
            journeysAreTheSame(journey, candidate)
        );

        if (existingJourney) {
            return existingJourney;
        }

        const journey: Journey = {
            ...candidate,
            id: getNewJourneyId(
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
        const journeyIsInASchedule = config.value.schedules
            .some((schedule) => schedule.journeyId === candidate.id);
        const isASavedJourney = config.value.journeys.some((journey) => journey.id === candidate.id);
        if (journeyIsInASchedule || !isASavedJourney) {
            return;
        }

        saveConfig({
            ...config.value,

            journeys: config.value.journeys.map((journey) =>
                journey.id === candidate.id
                    ? candidate
                    : journey
            ),
        });
    }

    function removeJourney(journeyId: string): boolean {
        const journeyIsInASchedule = config.value.schedules
            .some((schedule) => schedule.journeyId === journeyId);
        const isASavedJourney = config.value.journeys
            .some((journey) => journey.id === journeyId);
        if (journeyIsInASchedule || !isASavedJourney) {
            return false;
        }

        saveConfig({
            ...config.value,
            journeys: config.value.journeys
                .filter((journey) => journey.id !== journeyId),
        });

        return true;
    }

    return {
        config,
        saveConfig,
        saveJourney,
        updateJourney,
        removeJourney,
    };
});
