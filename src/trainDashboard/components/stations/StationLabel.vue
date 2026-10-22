<template>
    <span class="font-semibold" :style="{color: getStationColour(crs)}">
        {{ getStationName(crs) }}
    </span>
</template>

<script setup lang="ts">
import {getStationColour} from "../../stations/stationColours";
import {getStationName} from "../../stations/stations";

defineProps<{
    crs: string;
}>();
</script>
