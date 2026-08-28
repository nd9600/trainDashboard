<template>
    <div class="space-y-2">
        <JourneyMaker
            v-model:journey="journey"
            endpointMode="locations"
            originLabel="Start the journey from"
            destinationLabel="finish at"
            :stationGroups="stationGroups"
            :journeys="journeys"
            @changed="emit('changed')"
        />

        <p v-if="scheduleNames.length > 1" class="text-xs text-ink-subtle">
            Used by {{ scheduleNames.length }} schedules:
            {{ scheduleNames.join(", ") }}. Changes apply to all of them.
        </p>

        <button
            v-if="canRemove"
            class="appButton appButton--quiet px-0 py-1 text-xs text-danger hover:text-danger-dark"
            type="button"
            @click="emit('remove')"
        >
            <AppIcon class="size-3.5" name="trash" />
            Remove journey from schedule
        </button>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {Journey, StationGroup} from "../../../dto/dashboardConfig.dto";
import JourneyMaker from "../../journeys/JourneyMaker.vue";

withDefaults(
    defineProps<{
        stationGroups: StationGroup[];
        journeys: Journey[];
        scheduleNames: string[];
        canRemove?: boolean;
    }>(),
    {canRemove: true}
);

const journey = defineModel<Journey>("journey", {required: true});

const emit = defineEmits<{
    changed: [];
    remove: [];
}>();
</script>
