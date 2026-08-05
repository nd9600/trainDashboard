<template>
    <span class="whitespace-normal">
        <template v-if="details.origin.type === 'location'">
            {{ details.origin.name }}<template v-if="details.origin.stationCrs">
                <span>, from </span>
                <StationLabel :crs="details.origin.stationCrs" />
            </template>
        </template>
        <template v-else>
            <StationLabel :crs="details.origin.stationCrs" />
        </template>

        <span> → </span>

        <template v-if="details.destination.type === 'location'">
            {{ details.destination.name }}<template v-if="details.destination.stationCrs">
                <span>, arriving at </span>
                <StationLabel :crs="details.destination.stationCrs" />
            </template>
        </template>
        <template v-else>
            <StationLabel :crs="details.destination.stationCrs" />
        </template>

        <template v-if="details.connectingStationCrs">
            <span>, possibly connecting through </span>
            <StationLabel :crs="details.connectingStationCrs" />
        </template>
        <span v-else> (direct)</span>
    </span>
</template>

<script setup lang="ts">
import type {JourneyLabelDetails} from "../../journeys/journeyLabels";
import StationLabel from "../stations/StationLabel.vue";

defineProps<{
    details: JourneyLabelDetails;
}>();
</script>
