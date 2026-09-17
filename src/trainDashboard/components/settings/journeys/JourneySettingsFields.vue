<template>
    <div class="space-y-2">
        <JourneyMaker
            ref="journeyMaker"
            v-model:journey="journey"
            endpointMode="locations"
            originLabel="Start the journey from"
            destinationLabel="finish at"
            :stationGroups="stationGroups"
            :journeys="journeys"
            @changed="emit('changed')"
        />

        <p v-if="scheduleNames.length > 1" class="text-xs text-ink-subtle">
            Used by {{ scheduleNames.length }} schedules: {{ scheduleNames.join(", ") }}. Changes
            apply to all of them.
        </p>
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import type {Journey} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import JourneyMaker from "../../journeys/editing/JourneyMaker.vue";

defineProps<{
    stationGroups: StationGroup[];
    journeys: Journey[];
    scheduleNames: string[];
}>();

const journey = defineModel<Journey>("journey", {required: true});
const journeyMaker = ref<InstanceType<typeof JourneyMaker>>();

const emit = defineEmits<{
    changed: [];
}>();

onMounted(() => {
    journeyMaker.value?.focusOrigin();
});
</script>
