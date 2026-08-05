<template>
    <div class="text-sm leading-snug text-ink-muted">
        <p
            v-if="journey.segments.at(0)?.kind === 'walk'"
            class="flex items-baseline gap-1"
        >
            <time class="font-semibold text-ink">
                {{ formatTime(journey.segments.at(0)!.start) }}
            </time>
            Leave
        </p>

        <template
            v-for="(leg, legIndex) in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
        >
            <p class="flex min-w-0 items-baseline gap-x-1 whitespace-nowrap">
                <NationalRailLink
                    class="shrink-0 text-sm! font-semibold! text-ink!"
                    :originCrs="leg.origin"
                    :destinationCrs="leg.destination"
                    :departureMinutes="leg.departure"
                    :label="formatTime(leg.departure)"
                    :ariaLabel="`View the ${formatTime(leg.departure)} ${stationName(leg.origin)} to ${stationName(leg.destination)} journey on National Rail Enquiries`"
                />
                <strong
                    class="min-w-0 truncate"
                    :style="{color: stationColour(leg.origin)}"
                    :title="stationName(leg.origin) + leg.platform ? ` p${leg.platform}` : ''"
                >
                    {{ stationName(leg.origin) }}{{ leg.platform ? ` p${leg.platform}` : '' }}
                </strong>
                <span class="shrink-0">→</span>
                <strong
                    class="min-w-0 truncate"
                    :style="{color: stationColour(leg.destination)}"
                    :title="stationName(leg.destination)"
                >
                    {{ stationName(leg.destination) }}
                </strong>
                <time class="shrink-0 font-semibold text-ink">
                    {{ formatTime(leg.arrival) }}
                </time>
            </p>
            <p
                v-if="
                    legIndex === 0 && journey.alternativeFirstTrainLegs?.at(0)
                "
                class="flex justify-start"
            >
                <AlternativeFirstTrainLink
                    :trainLeg="journey.alternativeFirstTrainLegs[0]!"
                />
            </p>
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
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";
import AlternativeFirstTrainLink from "./AlternativeFirstTrainLink.vue";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
