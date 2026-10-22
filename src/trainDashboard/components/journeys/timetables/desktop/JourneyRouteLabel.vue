<template>
    <div>
        <p
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            class="text-ink-subtle"
        >
            <span class="font-semibold" :style="{color: getStationColour(leg.origin)}">
                {{ getStationName(leg.origin) }}
            </span>
            →
            <span class="font-semibold" :style="{color: getStationColour(leg.destination)}">
                {{ getStationName(leg.destination) }}
            </span>
            <span>· {{ formatTime(leg.departure) }}</span>
        </p>
    </div>
</template>

<script setup lang="ts">
import type {TimetabledJourney} from "../../../../dto/timetabledJourney.dto";
import {getStationColour} from "../../../../stations/stationColours";
import {getStationName} from "../../../../stations/stations";
import {formatTime} from "@/utilities/time.utility.ts";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
