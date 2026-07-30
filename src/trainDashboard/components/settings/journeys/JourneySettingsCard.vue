<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
            <strong>{{ stationPairName(pair, groups) }}</strong>
            <button
                class="appButton appButton--danger px-2 py-1"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                Remove journey
            </button>
        </div>
        <div class="space-y-3">
            <LocationReferenceInput
                v-model="pair.origin"
                :groups="groups"
                label="Start the journey from"
            />
            <LocationReferenceInput
                v-model="pair.destination"
                :groups="groups"
                label="Finish the journey at"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {StationGroup, StationPair} from "../../../dto/dashboardConfig.dto";
import {stationPairName} from "../../../presentation/settingsPresentation";
import LocationReferenceInput from "./LocationReferenceInput.vue";

defineProps<{
    groups: StationGroup[];
}>();

const pair = defineModel<StationPair>("pair", {required: true});

const emit = defineEmits<{
    remove: [];
}>();
</script>
