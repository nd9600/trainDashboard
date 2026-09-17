import {defineStore} from "pinia";
import {computed, onWatcherCleanup, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getDashboardJourneys} from "../journeys/getDashboardJourneys";
import type {JourneyRoute} from "../journeys/planning/journeyRoutes";
import {useDashboardClockStore} from "./dashboardClock.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore} from "./journeySelection.store";
import {useRailDataApiStore} from "./railDataApi.store";

export const useTrainServicesStore = defineStore("train-services", () => {
    const journeySelectionStore = useJourneySelectionStore();
    const dashboardClockStore = useDashboardClockStore();
    const dashboardConfigStore = useDashboardConfigStore();
    const apiStore = useRailDataApiStore();
    journeySelectionStore.initialise();

    const routes = ref<JourneyRoute[]>([]);
    const journeys = ref<TimetabledJourney[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadError = ref<string>();

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
        journeyLoadError.value = undefined;

        const consumerKey = apiStore.settings.consumerKey;

        try {
            const dashboardJourneys = await getDashboardJourneys(
                journeySelectionStore.activeJourneyDetails,
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
                journeyLoadError.value = "Add your Consumer key in Settings → API.";
            }
        } catch {
            if (!isCurrentRequest) {
                return;
            }
            journeys.value = [];
            journeyLoadError.value = "Train data could not be loaded. Try again later.";
        } finally {
            if (isCurrentRequest) {
                isLoadingJourneys.value = false;
            }
        }
    }

    watch(
        [
            () => journeySelectionStore.activeJourneyDetails,
            () => dashboardConfigStore.config.stationGroups,
            () => dashboardClockStore.currentMinutes,
            () => apiStore.settings.consumerKey,
        ],
        (values, previousValues) => {
            if (values[0] !== previousValues[0] || values[1] !== previousValues[1]) {
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
