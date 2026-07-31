import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    type CurrentClock,
    getActiveJourneyPlan,
} from "../journeys/getActiveJourneyPlan";
import {getTimetabledJourneys} from "../journeys/getTimetabledJourneys";
import {getRoutesWithoutTimetabledJourneys} from "../journeys/getRoutesWithoutTimetabledJourneys";
import {useRailDataApiStore} from "./railDataApi.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import type {Day} from "@/trainDashboard/dto/dashboardConfig.dto.ts";

export const useTrainServicesStore = defineStore("train-services", () => {
    const dashboardConfigStore = useDashboardConfigStore();
    const apiStore = useRailDataApiStore();

    ///// state /////
    const currentDate = new Date();
    const currentClock: CurrentClock = {
        day: currentDate.getDay() as Day,
        minutes: currentDate.getHours() * 60 + currentDate.getMinutes(),
    };
    const currentMinutes = ref(currentClock.minutes);
    const primaryJourneys = ref<TimetabledJourney[]>([]);
    const secondaryJourneys = ref<TimetabledJourney[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadError = ref<string>();

    ///// getters /////
    const currentJourneyPriorities = computed(() =>
        getActiveJourneyPlan(dashboardConfigStore.config, {
            day: currentClock.day,
            minutes: currentMinutes.value,
        })
    );
    const recommendedJourney = computed(() =>
        primaryJourneys.value.find((journey) => journey.recommended)
    );
    const primaryRoutesWithoutTimetabledJourneys = computed(() =>
        getRoutesWithoutTimetabledJourneys(
            currentJourneyPriorities.value.primaryRoutes,
            primaryJourneys.value
        )
    );

    ///// actions /////
    async function refreshJourneys(): Promise<void> {
        isLoadingJourneys.value = true;
        journeyLoadError.value = undefined;

        const consumerKey = apiStore.settings.consumerKey;

        if (!consumerKey) {
            primaryJourneys.value = [];
            secondaryJourneys.value = [];
            journeyLoadError.value = "Add your Consumer key in Settings → API.";
            isLoadingJourneys.value = false;
            return;
        }

        try {
            const [newPrimaryJourneys, newSecondaryJourneys] =
                await Promise.all([
                    getTimetabledJourneys(
                        consumerKey,
                        currentJourneyPriorities.value.primaryRoutes,
                        currentMinutes.value,
                        true
                    ),
                    getTimetabledJourneys(
                        consumerKey,
                        currentJourneyPriorities.value.secondaryRoutes,
                        currentMinutes.value,
                        false
                    ),
                ]);

            primaryJourneys.value = newPrimaryJourneys;
            secondaryJourneys.value = newSecondaryJourneys;
        } catch {
            primaryJourneys.value = [];
            secondaryJourneys.value = [];
            journeyLoadError.value =
                "Train data could not be loaded. Try again later.";
        } finally {
            isLoadingJourneys.value = false;
        }
    }

    ///// effects /////
    watch(
        [currentJourneyPriorities, () => apiStore.settings.consumerKey],
        refreshJourneys,
        {immediate: true}
    );

    ///// public API /////
    return {
        currentJourneyPriorities,
        isLoadingJourneys,
        journeyLoadError,
        currentMinutes,
        primaryJourneys,
        primaryRoutesWithoutTimetabledJourneys,
        recommendedJourney,
        secondaryJourneys,
    };
});
