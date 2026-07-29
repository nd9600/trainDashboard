<template>
    <main class="min-h-screen bg-[#f2efe7] font-sans text-[#172326]">
        <div class="relative mx-auto w-full max-w-[900px] px-6 pt-8 pb-8">
            <SettingsPanel />

            <header class="ml-3 pr-28">
                <p
                    class="m-0 flex items-center gap-2 text-sm tracking-[0.08em] text-[#687477] uppercase"
                >
                    <AppIcon class="size-4" :name="contextIcon" />
                    {{ resolved.schedule?.name ?? "Journeys" }}
                </p>
                <h1
                    class="my-1 [font-family:Georgia,serif] text-[2.3rem] font-normal"
                >
                    {{ heading }}
                </h1>
                <p v-if="recommendedJourney" class="m-0 text-[#485457]">
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
                <p class="mt-1 mb-0 text-sm text-[#687477]">
                    It is now {{ formatTime(now) }}
                </p>
            </header>

            <section v-if="primaryJourneys.length" class="mt-[18px]">
                <JourneyTimeline
                    :journeys="primaryJourneys"
                    :now="now"
                    :window-start="windowStart"
                    :window-end="windowEnd"
                />
            </section>
            <p
                v-else
                class="mt-8 rounded-lg border border-[#cbc8c0] bg-[#ebe8df] p-4 text-[#485457]"
            >
                No sample timetable is available for these station pairs yet.
            </p>

            <details
                v-if="secondaryJourneys.length"
                class="mt-8 rounded-lg border border-[#cbc8c0] bg-[#ebe8df]"
            >
                <summary
                    class="cursor-pointer px-4 py-3 font-semibold text-[#485457]"
                >
                    <span class="inline-flex items-center gap-2">
                        <AppIcon class="size-4" name="train" />
                        Other journeys
                    </span>
                </summary>
                <div class="border-t border-[#cbc8c0] bg-[#f2efe7] p-4">
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
import {computed} from "vue";
import AppIcon from "./components/AppIcon.vue";
import JourneyTimeline from "./components/JourneyTimeline.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import {
    clockContextFromDate,
    resolveDashboardConfig,
} from "./config/resolveDashboardConfig";
import {createMockJourneys} from "./mockJourneys";
import {stationColour} from "./stationColours";
import {stationName} from "./stations";
import {useDashboardConfigStore} from "./stores/dashboardConfig";

const configStore = useDashboardConfigStore();
const currentDate = new Date();
const clock = clockContextFromDate(currentDate);
const now = clock.minutes;
const windowStart = now - 5;
const windowEnd = now + 80;

const resolved = computed(() =>
    resolveDashboardConfig(configStore.config, clock)
);
const primaryJourneys = computed(() =>
    createMockJourneys(resolved.value.primaryPairs, now, true)
);
const secondaryJourneys = computed(() =>
    createMockJourneys(resolved.value.secondaryPairs, now, false)
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
        return resolved.value.schedule?.name ?? "Journeys";
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
        resolved.value.primaryPairs.at(0)?.destination.locationName;

    if (destinationName?.toLowerCase() === "work") {
        return "briefcase";
    }

    if (destinationName?.toLowerCase() === "home") {
        return "home";
    }

    return "train";
});

function formatTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
}
</script>
