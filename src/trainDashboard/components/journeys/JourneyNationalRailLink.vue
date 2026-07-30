<template>
    <span class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <NationalRailLink
            v-for="leg in journey.trainLegs"
            :key="`${leg.origin}-${leg.destination}-${leg.departure}`"
            :originCrs="leg.origin"
            :destinationCrs="leg.destination"
            :departureMinutes="leg.departure"
            :label="
                journey.trainLegs.length > 1
                    ? `${leg.origin} → ${leg.destination}, NRE`
                    : 'NRE'
            "
        />
    </span>
</template>

<script setup lang="ts">
import type {Journey} from "../../dto/journey.dto";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journey: Journey;
}>();
</script>
