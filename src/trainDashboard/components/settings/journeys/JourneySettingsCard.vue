<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
            <strong>{{ journeyName(journey, stationGroups) }}</strong>
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
                v-model="journey.origin"
                :stationGroups="stationGroups"
                :excludedGroupId="excludedGroupIdForOrigin"
                :excludedCrs="excludedCrsForOrigin"
                label="Start the journey from"
            />
            <LocationReferenceInput
                v-model="journey.destination"
                :stationGroups="stationGroups"
                :excludedGroupId="excludedGroupIdForDestination"
                :excludedCrs="excludedCrsForDestination"
                label="Finish the journey at"
            />
            <label v-if="journey.viaCrs !== undefined" class="sentenceField">
                Change trains at
                <StationInput
                    v-model="journey.viaCrs"
                    class="sentenceField__control min-w-52 grow"
                />
                <button
                    class="appButton appButton--danger appButton--icon"
                    type="button"
                    aria-label="Remove connecting station"
                    @click="removeConnectingStation"
                >
                    <AppIcon class="size-4" name="trash" />
                </button>
            </label>
            <p
                v-if="journey.viaCrs !== undefined"
                class="text-xs text-ink-subtle"
            >
                The dashboard allows at least 3 minutes to change trains. It
                cannot check the station’s official minimum connection time.
            </p>
            <button
                v-else
                class="appButton appButton--secondary py-1.5"
                type="button"
                @click="addConnectingStation"
            >
                <AppIcon class="size-4" name="plus" />
                Add connecting station
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {StationGroup, Journey} from "../../../dto/dashboardConfig.dto";
import {journeyName} from "../../../presentation/settingsPresentation";
import LocationReferenceInput from "./LocationReferenceInput.vue";
import StationInput from "../stationGroups/StationInput.vue";

defineProps<{
    stationGroups: StationGroup[];
}>();

const journey = defineModel<Journey>("journey", {required: true});

const excludedCrsForOrigin = computed(() =>
    journey.value.destination.type === "station"
        ? journey.value.destination.crs
        : undefined
);
const excludedCrsForDestination = computed(() =>
    journey.value.origin.type === "station"
        ? journey.value.origin.crs
        : undefined
);
const excludedGroupIdForOrigin = computed(
    () => journey.value.destination.groupId
);
const excludedGroupIdForDestination = computed(
    () => journey.value.origin.groupId
);

const emit = defineEmits<{
    changed: [];
    remove: [];
}>();

function addConnectingStation(): void {
    journey.value.viaCrs = "";
    emit("changed");
}

function removeConnectingStation(): void {
    delete journey.value.viaCrs;
    emit("changed");
}
</script>
