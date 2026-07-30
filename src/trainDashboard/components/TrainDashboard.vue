<template>
    <main class="min-h-screen">
        <div class="relative mx-auto w-full max-w-dashboard px-6 pt-8 pb-8">
            <TrainDashboardSettingsModal />

            <header class="ml-3 pr-28">
                <p
                    class="m-0 flex items-center gap-2 text-sm tracking-widest text-ink-subtle"
                >
                    <AppIcon class="size-4" :name="contextIcon" />
                    {{ journeyContext }}
                </p>
                <h1 class="my-1 font-display text-4xl font-normal">
                    {{ heading }}
                </h1>
                <p v-if="recommendedJourney" class="m-0 text-ink-muted">
                    {{ recommendationPrefix }}
                    <span
                        class="font-semibold"
                        :style="{
                            color: stationColour(recommendedJourney.origin),
                        }"
                    >
                        {{ stationName(recommendedJourney.origin) }}
                    </span>
                    for
                    {{ stationName(recommendedJourney.destination) }}
                </p>
                <p class="mt-1 mb-0 text-sm text-ink-subtle">
                    It is now {{ formatTime(now) }}
                </p>
            </header>

            <section v-if="primaryJourneys.length" class="mt-5">
                <JourneyTimeline
                    :journeys="primaryJourneys"
                    :now="now"
                    :window-start="windowStart"
                    :window-end="windowEnd"
                />
            </section>
            <p
                v-else
                class="mt-8 rounded-lg border border-line bg-surface p-4 text-ink-muted"
            >
                No sample timetable is available for these station pairs yet.
            </p>

            <details
                v-if="secondaryJourneys.length"
                class="group mt-8 rounded-lg border border-line bg-surface overflow-auto"
            >
                <summary
                    class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-ink-muted"
                >
                    <AppIcon
                        class="size-4 transition-transform group-open:rotate-90"
                        name="chevron"
                    />
                    <AppIcon class="size-4" name="train" />
                    Other journeys
                </summary>
                <div class="border-t border-line bg-canvas p-4">
                    <JourneyTimeline
                        :journeys="secondaryJourneys"
                        :now="now"
                        :window-start="windowStart"
                        :window-end="windowEnd"
                    />
                </div>
            </details>
        </div>
    </main>
</template>

<script setup lang="ts">
import {computed, defineAsyncComponent} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import JourneyTimeline from "./journeys/JourneyTimeline.vue";
import {
    clockContextFromDate,
    getCurrentJourneyPriorities,
} from "../journeys/getCurrentJourneyPriorities";
import {createMockJourneys} from "../journeys/mockJourneys";
import {stationColour} from "../stations/stationColours";
import {stationName} from "../stations/stations";
import {useTrainDashboardStore} from "../store/trainDashboard.store";

const TrainDashboardSettingsModal = defineAsyncComponent(
    () => import("./settings/TrainDashboardSettingsModal.vue")
);
const configStore = useTrainDashboardStore();
const currentDate = new Date();
const clock = clockContextFromDate(currentDate);
const now = clock.minutes;
const windowStart = now - 5;
const windowEnd = now + 80;

const currentJourneyPriorities = computed(() =>
    getCurrentJourneyPriorities(configStore.config, clock)
);
const primaryJourneys = computed(() =>
    createMockJourneys(currentJourneyPriorities.value.primaryPairs, now, true)
);
const secondaryJourneys = computed(() =>
    createMockJourneys(
        currentJourneyPriorities.value.secondaryPairs,
        now,
        false
    )
);
const recommendedJourney = computed(() =>
    primaryJourneys.value.find((journey) => journey.recommended)
);
const leaveIn = computed(() => {
    const journey = recommendedJourney.value;
    return journey ? journey.segments.at(0)!.start - now : undefined;
});
const heading = computed(() => {
    if (leaveIn.value === undefined) {
        return currentJourneyPriorities.value.schedule?.name ?? "Journeys";
    }

    if (leaveIn.value <= 0) {
        return "Leave now";
    }

    return `Leave in ${leaveIn.value} minute${leaveIn.value === 1 ? "" : "s"}`;
});
const recommendationPrefix = computed(() => {
    const firstSegment = recommendedJourney.value?.segments.at(0);
    return firstSegment?.kind === "walk" ? "Walk to" : "Train from";
});
const contextIcon = computed<"briefcase" | "home" | "train">(() => {
    const destinationName =
        currentJourneyPriorities.value.primaryPairs.at(0)?.destination
            .locationName;

    if (destinationName?.toLowerCase() === "work") {
        return "briefcase";
    }

    if (destinationName?.toLowerCase() === "home") {
        return "home";
    }

    return "train";
});
const journeyContext = computed(() => {
    const pair = currentJourneyPriorities.value.primaryPairs.at(0);

    if (!pair) {
        return currentJourneyPriorities.value.schedule?.name ?? "Journeys";
    }

    return `Going from ${pair.origin.locationName} to ${pair.destination.locationName}`;
});

function formatTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
}
</script>
