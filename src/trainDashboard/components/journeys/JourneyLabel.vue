<template>
    <span>
        {{ details.origin.name }}<template v-if="details.origin.stationCrs">
            <span>, through </span>
            <StationLabel :crs="details.origin.stationCrs" />
        </template>

        <span> → </span>

        {{ details.destination.name }}<template v-if="details.destination.stationCrs">
            <span>, arriving at </span>
            <StationLabel :crs="details.destination.stationCrs" />
        </template>

        <template v-if="details.connectingStationCrs">
            <span>, connecting through </span>
            <StationLabel :crs="details.connectingStationCrs" />
        </template>
    </span>
</template>

<script setup lang="ts">
import type {JourneyLabelDetails} from "../../journeys/journeyLabels";
import StationLabel from "../stations/StationLabel.vue";

defineProps<{
    details: JourneyLabelDetails;
}>();
</script>
