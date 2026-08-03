<template>
    <span class="font-semibold" :style="{color: stationColour(crs)}">
        {{ stationName(crs) }}
    </span>
</template>

<script setup lang="ts">
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";

defineProps<{
    crs: string;
}>();
</script>
