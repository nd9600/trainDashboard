<template>
    <div>
        <p
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
        >
            {{ stationName(leg.origin) }} → {{ stationName(leg.destination) }} ·
            {{ formatTime(leg.departure) }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {stationName} from "../../stations/stations";
import {formatTime} from "@/utilities/time.utility.ts";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
