<template>
    <p v-if="legs?.length" class="inline-flex items-baseline gap-1 pl-6 text-xs text-ink-subtle">
        Also at
        <span v-for="(leg, index) in legs" :key="`${leg.serviceId}-${leg.departure}`">
            <AlternativeTrainLink :trainLeg="leg" />{{ index < legs.length - 1 ? ", " : "" }}
        </span>
    </p>
</template>
<script setup lang="ts">
import type {TrainLeg} from "../../../dto/timetabledJourney.dto";
import AlternativeTrainLink from "./AlternativeTrainLink.vue";
defineProps<{legs?: TrainLeg[]}>();
</script>
