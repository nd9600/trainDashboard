<template>
    <div class="text-sm leading-snug text-ink-muted">
        <p
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            class="flex min-w-0 items-baseline gap-x-1 whitespace-nowrap"
        >
            <NationalRailLink
                class="shrink-0 text-sm! font-semibold! text-ink!"
                :originCrs="leg.origin"
                :destinationCrs="leg.destination"
                :departureMinutes="leg.departure"
                :label="formatTime(leg.departure)"
                :ariaLabel="`View the ${formatTime(leg.departure)} ${stationName(leg.origin)} to ${stationName(leg.destination)} journey on National Rail Enquiries`"
                :isDesktop="true"
            />
            <strong
                class="min-w-0 truncate"
                :style="{color: stationColour(leg.origin)}"
                :title="stationName(leg.origin)"
            >
                {{ stationName(leg.origin) }}
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

        <p v-if="journey.arrivalLabel && journey.arrivalTime">
            {{ journey.arrivalLabel }}
            <time class="font-semibold text-ink">
                {{ journey.arrivalTime }}
            </time>
        </p>
    </div>
</template>

<script setup lang="ts">
import {formatTime} from "@/utilities/time.utility.ts";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
