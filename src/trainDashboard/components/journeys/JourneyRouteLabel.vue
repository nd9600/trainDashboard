<template>
    <div>
        <p
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            class="text-ink-subtle"
        >
            <span
                class="font-semibold"
                :style="{color: stationColour(leg.origin)}"
            >
                {{ stationName(leg.origin) }}
            </span>
            →
            <span
                class="font-semibold"
                :style="{color: stationColour(leg.destination)}"
            >
                {{ stationName(leg.destination) }}
            </span>
            <span class="font-normal">· {{ formatTime(leg.departure) }}</span>
        </p>
    </div>
</template>

<script setup lang="ts">
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";
import {formatTime} from "@/utilities/time.utility.ts";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
