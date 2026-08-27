<template>
    <header class="min-w-0">
        <JourneySwitcher />
        <h1 class="mt-8 mb-1 font-display text-4xl font-normal">
            {{ leaveInString }}
        </h1>
        <p
            v-if="recommendedJourney"
            class="m-0 text-ink-muted text-sm sm:text-base flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-1"
        >
            <span>
                {{ shouldWalk ? "Walk to" : "Train from" }}
                <span
                    class="font-semibold"
                    :style="{
                        color: stationColour(recommendedJourney.origin),
                    }"
                >
                    {{ stationName(recommendedJourney.origin) }}
                </span>
            </span>
            <span>
                · train {{ formatTime(recommendedJourney.trainLegs[0]!.departure) }}
            </span>
            <span>
                · arrive
                <span
                    class="font-semibold"
                    :style="{
                        color: stationColour(recommendedJourney.destination),
                    }"
                >
                    {{ stationName(recommendedJourney.destination) }}
                </span>
                {{
                    recommendedJourney.arrivalTime ??
                    recommendedJourney.railArrivalTime
                }}
            </span>
            <span v-if="changeCount">
                · {{ changeCount }} change{{ changeCount === 1 ? "" : "s" }}
            </span>
        </p>
        <p class="mt-1 mb-0 text-sm text-ink-subtle">
            It is now {{ formatTime(currentMinutes) }}
        </p>
    </header>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {computed} from "vue";
import {formatTime} from "@/utilities/time.utility";
import {stationColour} from "../stations/stationColours";
import {stationName} from "../stations/stations";
import {useTrainServicesStore} from "../store/trainServices.store";
import JourneySwitcher from "./journeys/JourneySwitcher.vue";

const trainServicesStore = useTrainServicesStore();
const {activeJourneyId, currentMinutes, isLoadingJourneys, recommendedJourney} =
    storeToRefs(trainServicesStore);

const leaveInMinutes = computed(() => {
    const journey = recommendedJourney.value;
    return journey
        ? journey.segments.at(0)!.start - currentMinutes.value
        : undefined;
});

const leaveInString = computed(() => {
    if (leaveInMinutes.value === undefined) {
        if (isLoadingJourneys.value) {
            return "Finding trains…";
        }

        return activeJourneyId.value ? "Journey unavailable" : "Journeys";
    }

    if (leaveInMinutes.value <= 1) {
        return "Leave now";
    }

    return `Leave in ${leaveInMinutes.value} minutes`;
});

const shouldWalk = computed(() => {
    const firstSegment = recommendedJourney.value?.segments.at(0);
    return firstSegment?.kind === "walk";
});

const changeCount = computed(
    () => (recommendedJourney.value?.trainLegs.length ?? 1) - 1
);
</script>
