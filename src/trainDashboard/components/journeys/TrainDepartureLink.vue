<template>
    <NationalRailLink
        class="group relative whitespace-nowrap flex flex-col items-end sm:flex-row"
        :originCrs="trainLeg.origin"
        :destinationCrs="trainLeg.destination"
        :departureMinutes="scheduledDeparture"
        :label="formatTime(scheduledDeparture)"
        :ariaLabel="`${formatTime(scheduledDeparture)} ${stationName(trainLeg.origin)} to ${stationName(trainLeg.destination)}${delayMinutes > 0 ? `. ${delayDescription}` : ''}. View on National Rail Enquiries`"
    >
        {{ formatTime(scheduledDeparture) }}
        <span v-if="delayMinutes > 0" class="ml-1 text-amber-700 text-xs">
            (+{{ delayMinutes }}m)
        </span>
        <span
            v-if="delayMinutes > 0"
            role="tooltip"
            class="pointer-events-none absolute left-0 bottom-full z-50 hidden rounded bg-paper px-2 py-1 text-xs font-normal text-ink shadow-md group-hover:block group-focus-visible:block"
        >
            {{ delayDescription }}
        </span>
    </NationalRailLink>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {formatTime} from "@/utilities/time.utility";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import {stationName} from "../../stations/stations";
import NationalRailLink from "./NationalRailLink.vue";

const props = defineProps<{trainLeg: TrainLeg}>();
const scheduledDeparture = computed(
    () => props.trainLeg.scheduledDeparture ?? props.trainLeg.departure
);
const delayMinutes = computed(() =>
    Math.max(0, props.trainLeg.departure - scheduledDeparture.value)
);
const delayDescription = computed(
    () =>
        `Expected ${formatTime(props.trainLeg.departure)} · ${delayMinutes.value} minute${delayMinutes.value === 1 ? "" : "s"} late`
);
</script>
