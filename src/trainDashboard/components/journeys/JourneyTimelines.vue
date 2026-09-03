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
import type {
    TimetabledJourney,
    TrainLeg,
} from "../../dto/timetabledJourney.dto";
import {getJourneyTimelineRange} from "../../journeys/journeyTimes";
import JourneyCards from "./JourneyCards.vue";
import JourneyCharts from "./JourneyCharts.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    flushOnMobile?: boolean;
}>();

const routesWithConsistentPlatforms = computed(() =>
    getRoutesWithConsistentPlatforms(props.journeys)
);

function getRoutesWithConsistentPlatforms(
    journeys: TimetabledJourney[]
): Set<string> {
    const servicesByRoute = new Map<string, Map<string, string>>();

    for (const leg of getAllTrainLegs(journeys)) {
        if (!leg.platform) {
            continue;
        }

        const route = `${leg.origin}-${leg.destination}`;
        const services =
            servicesByRoute.get(route) ?? new Map<string, string>();
        services.set(`${leg.serviceId}:${leg.departure}`, leg.platform);
        servicesByRoute.set(route, services);
    }

    return new Set(
        Array.from(servicesByRoute)
            .filter(
                ([, services]) =>
                    services.size > 1 && new Set(services.values()).size === 1
            )
            .map(([route]) => route)
    );
}

function getAllTrainLegs(journeys: TimetabledJourney[]): TrainLeg[] {
    return journeys.flatMap((journey) =>
        journey.trainLegs.flatMap((leg) => [
            leg,
            ...(leg.alternativeTrainLegs ?? []),
        ])
    );
}

// 7. Limit the sorted journeys only after the planning steps are complete.
const firstSixJourneys = computed(() =>
    props.journeys
        .slice(0, 6)
        .map((journey) =>
            hideConsistentPlatforms(
                journey,
                routesWithConsistentPlatforms.value
            )
        )
);

function hideConsistentPlatforms(
    journey: TimetabledJourney,
    routesWithConsistentPlatforms: Set<string>
): TimetabledJourney {
    return {
        ...journey,
        trainLegs: journey.trainLegs.map((leg) =>
            hideConsistentPlatform(leg, routesWithConsistentPlatforms)
        ),
    };
}

function hideConsistentPlatform(
    leg: TrainLeg,
    routesWithConsistentPlatforms: Set<string>
): TrainLeg {
    return {
        ...leg,
        platform: !leg.platform
            ? null
            : routesWithConsistentPlatforms.has(
                    `${leg.origin}-${leg.destination}`
                )
              ? undefined
              : leg.platform,
    };
}
const timelineRange = computed(() =>
    getJourneyTimelineRange(firstSixJourneys.value, props.currentMinutes)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
