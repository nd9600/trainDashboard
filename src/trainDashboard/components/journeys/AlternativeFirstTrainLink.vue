<template>
    <span
        class="inline-flex items-baseline justify-end gap-1 text-xs text-ink-subtle"
    >
        Also at
        <NationalRailLink
            class="text-xs!"
            :originCrs="trainLeg.origin"
            :destinationCrs="trainLeg.destination"
            :departureMinutes="trainLeg.departure"
            :label="formatTime(trainLeg.departure)"
            :ariaLabel="`View the alternative ${formatTime(trainLeg.departure)} ${stationName(trainLeg.origin)} to ${stationName(trainLeg.destination)} journey on National Rail Enquiries`"
            :isDesktop="isDesktop"
        />
    </span>
</template>

<script setup lang="ts">
import {formatTime} from "@/utilities/time.utility.ts";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import {stationName} from "../../stations/stations";
import NationalRailLink from "./NationalRailLink.vue";

withDefaults(
    defineProps<{
        trainLeg: TrainLeg;
        isDesktop?: boolean;
    }>(),
    {isDesktop: false}
);
</script>
