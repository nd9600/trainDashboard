import {defineStore} from "pinia";
import {computed, onWatcherCleanup, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getDashboardJourneys} from "../journeys/getDashboardJourneys";
import type {JourneyRoute} from "../journeys/planning/journeyRoutes";
import {useDashboardClockStore} from "./dashboardClock.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore} from "./journeySelection.store";
import {useRailDataApiStore} from "./railDataApi.store";

export enum JourneyLoadError {
    NoConsumerKey = "NoConsumerKey",
    DataCouldntBeLoaded = "DataCouldntBeLoaded",
}

export const useTrainServicesStore = defineStore("train-services", () => {
    const journeySelectionStore = useJourneySelectionStore();
    const dashboardClockStore = useDashboardClockStore();
    const dashboardConfigStore = useDashboardConfigStore();
    const railDataApiStore = useRailDataApiStore();
    journeySelectionStore.initialise();

    const routes = ref<JourneyRoute[]>([]);
    const journeys = ref<TimetabledJourney[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadError = ref<JourneyLoadError|null>(null);

    const recommendedJourney = computed(() =>
        journeys.value.find((journey) => journey.recommended)
    );

    async function refreshJourneys(): Promise<void> {
        let isCurrentRequest = true;
        // Location or selection changes can start a request before this one finishes.
        onWatcherCleanup(() => {
            isCurrentRequest = false;
        });
        isLoadingJourneys.value = true;
        journeyLoadError.value = null;

        const consumerKey = railDataApiStore.settings.consumerKey;

        try {
            const dashboardJourneys = await getDashboardJourneys(
                journeySelectionStore.activeJourney,
                dashboardConfigStore.config.stationGroups,
                dashboardClockStore.currentMinutes,
                consumerKey
            );

            if (!isCurrentRequest) {
                return;
            }

            routes.value = dashboardJourneys.routes;
            journeys.value = dashboardJourneys.journeys;

            if (!consumerKey) {
                journeyLoadError.value = JourneyLoadError.NoConsumerKey;
            }
        } catch {
            if (!isCurrentRequest) {
                return;
            }
            journeys.value = [];
            journeyLoadError.value = JourneyLoadError.DataCouldntBeLoaded;
        } finally {
            if (isCurrentRequest) {
                isLoadingJourneys.value = false;
            }
        }
    }

    watch(
        [
            () => journeySelectionStore.activeJourney,
            () => dashboardConfigStore.config.stationGroups,
            () => dashboardClockStore.currentMinutes,
            () => railDataApiStore.settings.consumerKey,
        ],
        ([activeJourney, stationGroups], [previousActiveJourney, previousStationGroups]) => {
            const activeJourneyHasChanged = activeJourney !== previousActiveJourney;
            const stationGroupsHaveChanged = stationGroups !== previousStationGroups;
            if (activeJourneyHasChanged || stationGroupsHaveChanged) {
                routes.value = [];
                journeys.value = [];
            }
            return refreshJourneys();
        },
        {immediate: true}
    );

    return {
        isLoadingJourneys,
        journeyLoadError,
        journeys,
        routes,
        recommendedJourney,
    };
});
