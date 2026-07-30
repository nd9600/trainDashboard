<template>
    <span>
        <span
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            class="block"
        >
            {{ stationName(leg.origin) }} →
            {{ stationName(leg.destination) }} ·
            {{ formatTime(leg.departure) }}
        </span>
    </span>
</template>

<script setup lang="ts">
import type {Journey} from "../../dto/journey.dto";
import {stationName} from "../../stations/stations";

defineProps<{
    journey: Journey;
}>();

function formatTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
}
</script>
