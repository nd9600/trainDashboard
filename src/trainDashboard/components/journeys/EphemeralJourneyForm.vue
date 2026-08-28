<template>
    <form
        class="max-w-[calc(100vw-2rem)] space-y-3 rounded-lg border border-line bg-paper p-3 shadow-sm"
        @submit.prevent="useJourney"
    >
        <JourneyMaker
            v-model:journey="journey"
            endpointMode="stations"
            originLabel="From"
            destinationLabel="To"
        />
        <div class="flex gap-2">
            <button
                class="appButton appButton--primary py-1.5"
                type="submit"
                :disabled="!ephemeralJourney"
            >
                Use journey
            </button>
            <button
                class="appButton appButton--quiet py-1.5"
                type="button"
                @click="emit('cancel')"
            >
                Cancel
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import type {Journey, JourneyFields} from "../../dto/dashboardConfig.dto";
import {createEphemeralJourney} from "../../dto/journeySelection.dto";
import JourneyMaker from "./JourneyMaker.vue";

const emit = defineEmits<{
    cancel: [];
    use: [journey: JourneyFields];
}>();

const journey = ref<Journey>(getEmptyJourney());
const ephemeralJourney = computed(() => createEphemeralJourney(journey.value));

function useJourney(): void {
    if (!ephemeralJourney.value) {
        return;
    }

    emit("use", journey.value);
    journey.value = getEmptyJourney();
}

function getEmptyJourney(): Journey {
    return {
        id: "ephemeral-journey",
        origin: {type: "station", crs: ""},
        destination: {type: "station", crs: ""},
    };
}
</script>
