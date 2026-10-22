<template>
    <JourneyCards class="sm:hidden" :journeys="firstSixJourneys" :currentMinutes="currentMinutes" />
    <JourneyCharts
        class="hidden sm:grid"
        :journeys="firstSixJourneys"
        :currentMinutes="currentMinutes"
        :windowStart="timelineStart"
        :windowEnd="timelineEnd"
    />
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {TimetabledJourney, TrainLeg} from "../../../dto/timetabledJourney.dto";
import {getJourneyTimelineRange} from "../../../journeys/journeyTimes";
import JourneyCards from "./mobile/JourneyCards.vue";
import JourneyCharts from "./desktop/JourneyCharts.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
}>();

const stationPairsWithConsistentPlatforms = computed(() =>
    getStationPairsWithConsistentPlatforms(props.journeys)
);

function getStationPairsWithConsistentPlatforms(journeys: TimetabledJourney[]): Set<string> {
    const platformsByStationPair = new Map<string, Map<string, string>>();

    for (const leg of getAllTrainLegs(journeys)) {
        if (!leg.platform) {
            continue;
        }

        const stationPairKey = `${leg.origin}-${leg.destination}`;
        const platformsByService = platformsByStationPair.get(stationPairKey)
            ?? new Map<string, string>();
        platformsByService.set(`${leg.serviceId}:${leg.departure}`, leg.platform);
        platformsByStationPair.set(stationPairKey, platformsByService);
    }

    return new Set(
        Array.from(platformsByStationPair)
            .filter(([, platformsByService]) =>
                platformsByService.size > 1
                && new Set(platformsByService.values()).size === 1
            )
            .map(([stationPairKey]) => stationPairKey)
    );
}

function getAllTrainLegs(journeys: TimetabledJourney[]): TrainLeg[] {
    return journeys.flatMap((journey) =>
        journey.trainLegs.flatMap((leg) => [leg, ...(leg.alternativeTrainLegs ?? [])])
    );
}

const firstSixJourneys = computed(() =>
    props.journeys
        .slice(0, 6)
        .map((journey) => hideConsistentPlatforms(journey, stationPairsWithConsistentPlatforms.value))
);

function hideConsistentPlatforms(
    journey: TimetabledJourney,
    stationPairsWithConsistentPlatforms: Set<string>
): TimetabledJourney {
    return {
        ...journey,
        trainLegs: journey.trainLegs.map((leg) =>
            hideConsistentPlatform(leg, stationPairsWithConsistentPlatforms)
        ),
    };
}

function hideConsistentPlatform(
    leg: TrainLeg,
    stationPairsWithConsistentPlatforms: Set<string>
): TrainLeg {
    if (!leg.platform) {
        return {...leg, platform: null};
    }

    const stationPairKey = `${leg.origin}-${leg.destination}`;
    const shouldHidePlatform = stationPairsWithConsistentPlatforms.has(stationPairKey);
    return {...leg, platform: shouldHidePlatform ? undefined : leg.platform};
}
const timelineRange = computed(() =>
    getJourneyTimelineRange(firstSixJourneys.value, props.currentMinutes)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
