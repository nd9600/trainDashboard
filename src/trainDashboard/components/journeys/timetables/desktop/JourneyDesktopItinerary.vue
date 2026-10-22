<template>
    <div class="text-sm leading-snug text-ink-muted">
        <p v-if="journey.segments.at(0)?.kind === 'walk'" class="flex items-baseline gap-1">
            <time class="font-semibold text-ink">
                {{ formatTime(journey.segments.at(0)!.start) }}
            </time>
            Leave
        </p>

        <template
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
        >
            <p class="flex items-baseline gap-x-1 whitespace-nowrap">
                <TrainDepartureLink
                    class="shrink-0 text-sm! font-semibold! text-ink!"
                    :trainLeg="leg"
                />
                <strong
                    class="min-w-0 truncate"
                    :style="{color: getStationColour(leg.origin)}"
                    :title="getStationName(leg.origin)"
                >
                    {{ getStationName(leg.origin) }}
                </strong>
                <span
                    v-if="leg.platform !== undefined"
                    class="shrink-0 text-xs font-semibold"
                    :style="{color: getStationColour(leg.origin)}"
                >
                    p{{ leg.platform ?? "_" }}
                </span>
                <span class="shrink-0">→</span>
                <strong
                    class="min-w-0 truncate"
                    :style="{color: getStationColour(leg.destination)}"
                    :title="getStationName(leg.destination)"
                >
                    {{ getStationName(leg.destination) }}
                </strong>
                <time class="shrink-0 font-semibold text-ink">
                    {{ formatTime(leg.arrival) }}
                </time>
            </p>
            <AlternativeTrains :legs="leg.alternativeTrainLegs" />
        </template>

        <p v-if="journey.arrivalLabel && journey.arrivalTime">
            <time class="font-semibold text-ink">
                {{ journey.arrivalTime }}
            </time>
            {{ journey.arrivalLabel }}
        </p>
    </div>
</template>

<script setup lang="ts">
import {formatTime} from "@/utilities/time.utility.ts";
import type {TimetabledJourney} from "../../../../dto/timetabledJourney.dto";
import {getStationColour} from "../../../../stations/stationColours";
import {getStationName} from "../../../../stations/stations";
import AlternativeTrains from "../AlternativeTrains.vue";
import TrainDepartureLink from "../TrainDepartureLink.vue";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
