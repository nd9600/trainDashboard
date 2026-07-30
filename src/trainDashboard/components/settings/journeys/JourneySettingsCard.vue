<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
            <strong>{{ stationPairName(pair, groups) }}</strong>
            <button
                class="flex items-center gap-1.5 px-2 py-1 text-sm text-danger hover:underline"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                Remove journey
            </button>
        </div>
        <div class="space-y-3">
            <fieldset>
                <legend class="mb-1 text-sm font-semibold">From</legend>
                <LocationReferenceInput
                    v-model="pair.origin"
                    :groups="groups"
                />
            </fieldset>
            <fieldset>
                <legend class="mb-1 text-sm font-semibold">To</legend>
                <LocationReferenceInput
                    v-model="pair.destination"
                    :groups="groups"
                />
            </fieldset>
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
