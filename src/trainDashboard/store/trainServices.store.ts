import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import type {Journey} from "../dto/journey.dto";
import {
    type CurrentClock,
    getCurrentJourneyPriorities,
} from "../journeys/getCurrentJourneyPriorities";
import {getJourneys} from "../journeys/getJourneys";
import {getStationPairsWithoutJourneys} from "../journeys/getStationPairsWithoutJourneys";
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
    const primaryJourneys = ref<Journey[]>([]);
    const secondaryJourneys = ref<Journey[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadingError = ref<string>();

    ///// getters /////
    const currentJourneyPriorities = computed(() =>
        getCurrentJourneyPriorities(dashboardConfigStore.config, {
            day: currentClock.day,
            minutes: currentMinutes.value,
        })
    );
    const recommendedJourney = computed(() =>
        primaryJourneys.value.find((journey) => journey.recommended)
    );
    const primaryPairsWithoutJourneys = computed(() =>
        getStationPairsWithoutJourneys(
            currentJourneyPriorities.value.primaryPairs,
            primaryJourneys.value
        )
    );

    ///// actions /////
    async function refreshJourneys(): Promise<void> {
        isLoadingJourneys.value = true;
        journeyLoadingError.value = undefined;

        const consumerKey = apiStore.settings.consumerKey;

        if (!consumerKey) {
            primaryJourneys.value = [];
            secondaryJourneys.value = [];
            journeyLoadingError.value =
                "Add your Consumer key in Settings → API.";
            isLoadingJourneys.value = false;
            return;
        }

        try {
            const [newPrimaryJourneys, newSecondaryJourneys] =
                await Promise.all([
                    getJourneys(
                        consumerKey,
                        currentJourneyPriorities.value.primaryPairs,
                        currentMinutes.value,
                        true
                    ),
                    getJourneys(
                        consumerKey,
                        currentJourneyPriorities.value.secondaryPairs,
                        currentMinutes.value,
                        false
                    ),
                ]);

            primaryJourneys.value = newPrimaryJourneys;
            secondaryJourneys.value = newSecondaryJourneys;
        } catch {
            primaryJourneys.value = [];
            secondaryJourneys.value = [];
            journeyLoadingError.value =
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
        journeyLoadingError,
        currentMinutes,
        primaryJourneys,
        primaryPairsWithoutJourneys,
        recommendedJourney,
        secondaryJourneys,
    };
});
