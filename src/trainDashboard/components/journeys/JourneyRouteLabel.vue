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
import {formatTime} from "@/utilities/time.utility.ts";

defineProps<{
    journey: Journey;
}>();

</script>
