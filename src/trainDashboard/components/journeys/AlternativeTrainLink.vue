<template>
    <TrainDepartureLink class="text-xs!" :trainLeg="trainLeg" />
</template>

<script setup lang="ts">
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import TrainDepartureLink from "./TrainDepartureLink.vue";

defineProps<{trainLeg: TrainLeg}>();
</script>
