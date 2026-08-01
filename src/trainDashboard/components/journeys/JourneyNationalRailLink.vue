<template>
    <span class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <NationalRailLink
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            class="max-w-full"
            :originCrs="leg.origin"
            :destinationCrs="leg.destination"
            :departureMinutes="leg.departure"
            :label="`${leg.origin} → ${leg.destination}, NRE`"
        />
    </span>
</template>

<script setup lang="ts">
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journey: TimetabledJourney;
}>();
</script>
