<template>
    <header>
        <p
            class="m-0 flex items-center gap-2 text-sm tracking-widest text-ink-subtle"
        >
            <AppIcon class="size-4" :name="journeyDestinationIcon" />
            {{ journeyDescription }}
        </p>
        <h1 class="my-1 font-display text-4xl font-normal">
            {{ leaveInString }}
        </h1>
        <p v-if="recommendedJourney" class="m-0 text-ink-muted">
            {{ shouldWalk ? "Walk to" : "Train from" }}
            <span
                class="font-semibold"
                :style="{
                    color: stationColour(recommendedJourney.origin),
                }"
            >
                {{ stationName(recommendedJourney.origin) }}
            </span>
            · train
            {{ formatTime(recommendedJourney.trainLegs[0]!.departure) }} ·
            arrive
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
            <template v-if="changeCount">
                · {{ changeCount }} change{{ changeCount === 1 ? "" : "s" }}
            </template>
        </p>
        <p class="mt-1 mb-0 text-sm text-ink-subtle">
            It is now {{ formatTime(currentMinutes) }}
        </p>
    </header>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import {formatTime} from "@/utilities/time.utility";
import {stationColour} from "../stations/stationColours";
import {stationName} from "../stations/stations";
import {useTrainServicesStore} from "../store/trainServices.store";

const trainServicesStore = useTrainServicesStore();
const {activeSchedule, currentMinutes, primaryRoutes, recommendedJourney} =
    storeToRefs(trainServicesStore);

const journeyDestinationIcon = computed<"briefcase" | "home" | "train">(() => {
    const destinationName = primaryRoutes.value.at(0)?.destination.locationName;

    if (destinationName?.toLowerCase() === "work") {
        return "briefcase";
    }

    if (destinationName?.toLowerCase() === "home") {
        return "home";
    }

    return "train";
});

const journeyDescription = computed(() => {
    const journeys = primaryRoutes.value.at(0);

    if (!journeys) {
        return activeSchedule.value?.name ?? "Journeys";
    }

    return `Going from ${journeys.origin.locationName} to ${journeys.destination.locationName}`;
});

const leaveInMinutes = computed(() => {
    const journey = recommendedJourney.value;
    return journey
        ? journey.segments.at(0)!.start - currentMinutes.value
        : undefined;
});

const leaveInString = computed(() => {
    if (leaveInMinutes.value === undefined) {
        return activeSchedule.value?.name ?? "Journeys";
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
