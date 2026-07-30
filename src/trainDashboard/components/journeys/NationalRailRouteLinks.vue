<template>
    <div
        class="rounded-lg border border-line bg-surface p-3 text-sm text-ink-muted"
    >
        <p>Check these routes on National Rail Enquiries:</p>
        <ul class="mt-2 space-y-1">
            <li v-for="pair in pairs" :key="pair.id">
                <NationalRailLink
                    :originCrs="pair.origin.crs"
                    :destinationCrs="pair.destination.crs"
                    :departureMinutes="departureMinutes"
                    :label="`${stationName(pair.origin.crs)} → ${stationName(pair.destination.crs)}, NRE`"
                />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {ResolvedStationPair} from "../../journeys/getCurrentJourneyPriorities";
import {stationName} from "../../stations/stations";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    pairs: ResolvedStationPair[];
    departureMinutes: number;
}>();
</script>
