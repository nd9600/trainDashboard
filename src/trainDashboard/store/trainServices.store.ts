import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    type CurrentClock,
    getActiveJourneyPlan,
} from "../journeys/planning/activeJourneyPlan";
import {getTimetabledJourneys} from "../journeys/timetable/getTimetabledJourneys";
import {getRoutesWithoutTimetabledJourneys} from "../journeys/missingTimetables/getRoutesWithoutTimetabledJourneys";
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
    const activeJourneyPlan = computed(() =>
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
            activeJourneyPlan.value.primaryRoutes,
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
                        activeJourneyPlan.value.primaryRoutes,
                        currentMinutes.value,
                        true
                    ),
                    getTimetabledJourneys(
                        consumerKey,
                        activeJourneyPlan.value.secondaryRoutes,
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
        [activeJourneyPlan, () => apiStore.settings.consumerKey],
        refreshJourneys,
        {immediate: true}
    );

    ///// public API /////
    return {
        activeJourneyPlan,
        isLoadingJourneys,
        journeyLoadError,
        currentMinutes,
        primaryJourneys,
        primaryRoutesWithoutTimetabledJourneys,
        recommendedJourney,
        secondaryJourneys,
    };
});
