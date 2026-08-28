<template>
    <header class="min-w-0">
        <JourneySwitcher />
        <h1
            class="mt-8 mb-1 font-display text-4xl"
            :class="isLoadingJourneys ? 'text-surface' : ''"
        >
            {{ leaveInString }}
        </h1>
        <p
            v-if="headerJourney"
            class="text-ink-muted text-sm sm:text-base flex flex-col sm:flex-row items-start sm:items-center flex-wrap gap-1"
        >
            <span>
                {{ shouldWalk ? "Walk to" : "Train from" }}
                <span
                    class="font-semibold"
                    :style="{
                        color: stationColour(headerJourney.origin),
                    }"
                >
                    {{ stationName(headerJourney.origin) }}
                </span>
            </span>
            <span>
                · train {{ formatTime(headerJourney.trainLegs[0]!.departure) }}
            </span>
            <span>
                · arrive
                <span
                    class="font-semibold"
                    :style="{
                        color: stationColour(headerJourney.destination),
                    }"
                >
                    {{ stationName(headerJourney.destination) }}
                </span>
                {{ headerJourney.arrivalTime ?? headerJourney.railArrivalTime }}
            </span>
            <span v-if="changeCount">
                · {{ changeCount }} change{{ changeCount === 1 ? "" : "s" }}
            </span>
        </p>
        <p class="mt-1 text-sm text-ink-subtle">
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
import {useJourneySelectionStore} from "../store/journeySelection.store";
import JourneySwitcher from "./journeys/JourneySwitcher.vue";

const trainServicesStore = useTrainServicesStore();
const journeySelectionStore = useJourneySelectionStore();
const {isLoadingJourneys, journeys, recommendedJourney} =
    storeToRefs(trainServicesStore);
const {activeJourneyIsEphemeral, activeJourneyId, currentMinutes} = storeToRefs(
    journeySelectionStore
);

const headerJourney = computed(
    () => recommendedJourney.value ?? journeys.value.at(0)
);

const leaveInMinutes = computed(() => {
    const journey = recommendedJourney.value;
    return journey
        ? journey.segments.at(0)!.start - currentMinutes.value
        : undefined;
});

const leaveInString = computed(() => {
    if (isLoadingJourneys.value) {
        return "Finding trains…";
    }
    if (activeJourneyIsEphemeral.value) {
        if (!headerJourney.value) {
            return "No trains found";
        }

        const trainInMinutes =
            headerJourney.value.trainLegs[0]!.departure - currentMinutes.value;

        if (trainInMinutes <= 0) {
            return "Train now";
        }

        return `Train in ${trainInMinutes} minute${trainInMinutes === 1 ? "" : "s"}`;
    }

    if (leaveInMinutes.value === undefined) {
        const nextJourney = headerJourney.value;

        if (nextJourney) {
            return `Next train at ${formatTime(nextJourney.trainLegs[0]!.departure)}`;
        }

        return activeJourneyId.value ? "No trains found" : "Journeys";
    }

    if (leaveInMinutes.value <= 1) {
        return "Leave now";
    }

    return `Leave in ${leaveInMinutes.value} minutes`;
});

const shouldWalk = computed(() => {
    const firstSegment = headerJourney.value?.segments.at(0);
    return firstSegment?.kind === "walk";
});

const changeCount = computed(
    () => (headerJourney.value?.trainLegs.length ?? 1) - 1
);
</script>
