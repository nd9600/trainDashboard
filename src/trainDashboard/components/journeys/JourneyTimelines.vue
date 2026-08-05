<template>
    <JourneyCards
        class="sm:hidden"
        :journeys="firstSixJourneys"
        :currentMinutes="currentMinutes"
        :mustLeaveJourneyId="mustLeaveJourneyId"
        :flush="flushOnMobile"
    />
    <JourneyCharts
        class="hidden sm:grid"
        :journeys="firstSixJourneys"
        :currentMinutes="currentMinutes"
        :mustLeaveJourneyId="mustLeaveJourneyId"
        :windowStart="timelineStart"
        :windowEnd="timelineEnd"
    />
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {getJourneyTimelineRange} from "../../journeys/journeyTimes";
import JourneyCards from "./JourneyCards.vue";
import JourneyCharts from "./JourneyCharts.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    flushOnMobile?: boolean;
}>();

const routesWithVaryingPlatforms = computed(() => {
    const platformsByRoute = new Map<string, Set<string>>();

    props.journeys
        .flatMap((journey) => [
            ...journey.trainLegs,
            ...(journey.alternativeFirstTrainLegs ?? []),
        ])
        .forEach((leg) => {
            if (!leg.platform) {
                return;
            }

            const route = `${leg.origin}-${leg.destination}`;
            const platforms = platformsByRoute.get(route) ?? new Set<string>();
            platforms.add(leg.platform);
            platformsByRoute.set(route, platforms);
        });

    return new Set(
        Array.from(platformsByRoute)
            .filter(([, platforms]) => platforms.size > 1)
            .map(([route]) => route)
    );
});

// 7. Limit the sorted journeys only after the planning steps are complete.
const firstSixJourneys = computed(() =>
    props.journeys.slice(0, 6).map((journey) => ({
        ...journey,
        trainLegs: journey.trainLegs.map((leg) => ({
            ...leg,
            platform: !leg.platform
                ? null
                : routesWithVaryingPlatforms.value.has(
                        `${leg.origin}-${leg.destination}`
                    )
                  ? leg.platform
                  : undefined,
        })),
    }))
);
const timelineRange = computed(() =>
    getJourneyTimelineRange(firstSixJourneys.value, props.currentMinutes)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
