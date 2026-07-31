import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {createRailDataMarketplaceApi} from "../api/railDataMarketplace.api";
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

    const currentJourneyPriorities = computed(() =>
        getCurrentJourneyPriorities(dashboardConfigStore.config, {
            day: currentClock.day,
            minutes: currentMinutes.value,
        })
    );
    const journeyRequest = computed(() => ({
        priorities: currentJourneyPriorities.value,
        consumerKey: apiStore.settings.consumerKey,
    }));
    const recommendedJourney = computed(() =>
        primaryJourneys.value.find((journey) => journey.recommended)
    );
    const primaryPairsWithoutJourneys = computed(() =>
        getStationPairsWithoutJourneys(
            currentJourneyPriorities.value.primaryPairs,
            primaryJourneys.value
        )
    );

    watch(
        journeyRequest,
        async ({priorities, consumerKey}) => {
            isLoadingJourneys.value = true;
            journeyLoadingError.value = undefined;

            if (!consumerKey) {
                primaryJourneys.value = [];
                secondaryJourneys.value = [];
                journeyLoadingError.value =
                    "Add your Consumer key in Settings → API.";
                isLoadingJourneys.value = false;
                return;
            }

            try {
                const railDataMarketplaceApi = createRailDataMarketplaceApi({
                    consumerKey,
                });
                const [newPrimaryJourneys, newSecondaryJourneys] =
                    await Promise.all([
                        getJourneys(
                            railDataMarketplaceApi,
                            priorities.primaryPairs,
                            currentMinutes.value,
                            true
                        ),
                        getJourneys(
                            railDataMarketplaceApi,
                            priorities.secondaryPairs,
                            currentMinutes.value,
                            false
                        ),
                    ]);

                primaryJourneys.value = newPrimaryJourneys;
                secondaryJourneys.value = newSecondaryJourneys;
            } catch {
                primaryJourneys.value = [];
                secondaryJourneys.value = [];
                journeyLoadingError.value = "Train data could not be loaded. Try again later.";
            } finally {
                isLoadingJourneys.value = false;
            }
        },
        {immediate: true}
    );

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
