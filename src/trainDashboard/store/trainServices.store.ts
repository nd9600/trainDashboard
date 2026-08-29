import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
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

    ///// state /////
    const routes = ref<JourneyRoute[]>([]);
    const journeys = ref<TimetabledJourney[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadError = ref<string>();

    ///// getters /////
    const recommendedJourney = computed(() =>
        journeys.value.find((journey) => journey.recommended)
    );

    ///// actions /////
    async function refreshJourneys(): Promise<void> {
        isLoadingJourneys.value = true;
        journeyLoadError.value = undefined;

        const consumerKey = apiStore.settings.consumerKey;

        try {
            const dashboardJourneys = await getDashboardJourneys(
                journeySelectionStore.activeJourneyDetails,
                dashboardConfigStore.config.stationGroups,
                dashboardClockStore.currentClock,
                consumerKey
            );

            routes.value = dashboardJourneys.routes;
            journeys.value = dashboardJourneys.journeys;

            if (!consumerKey) {
                journeyLoadError.value =
                    "Add your Consumer key in Settings → API.";
            }
        } catch {
            journeys.value = [];
            journeyLoadError.value =
                "Train data could not be loaded. Try again later.";
        } finally {
            isLoadingJourneys.value = false;
        }
    }

    ///// effects /////
    watch(
        [
            () => journeySelectionStore.activeJourneyDetails,
            () => dashboardConfigStore.config.stationGroups,
            () => dashboardClockStore.currentMinutes,
            () => apiStore.settings.consumerKey,
        ],
        refreshJourneys,
        {immediate: true}
    );

    ///// public interface /////
    return {
        isLoadingJourneys,
        journeyLoadError,
        journeys,
        routes,
        recommendedJourney,
    };
});
