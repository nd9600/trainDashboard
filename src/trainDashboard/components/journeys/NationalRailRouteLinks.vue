<template>
    <div
        class="rounded-lg border border-line bg-surface p-3 text-sm sm:text-base text-ink-muted"
    >
        <p>
            No journeys were found for these routes, check them out on National Rail Enquiries:
        </p>
        <ul class="mt-2 space-y-1">
            <li v-for="route in journeyRoutes" :key="route.id">
                <NationalRailLink
                    class="text-sm!"
                    :originCrs="route.origin.crs"
                    :destinationCrs="route.destination.crs"
                    :departureMinutes="departureMinutes"
                    :label="`${stationName(route.origin.crs)} → ${stationName(route.destination.crs)}, NRE`"
                />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {JourneyRoute} from "../../journeys/planning/journeyRoutes";
import {stationName} from "../../stations/stations";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journeyRoutes: JourneyRoute[];
    departureMinutes: number;
}>();
</script>
