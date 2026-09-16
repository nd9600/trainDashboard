<template>
    <div
        v-if="explanation || location || !configStore.config.shouldUseLocation"
        class="text-xs text-ink-subtle"
        data-test="prediction-explanation"
    >
        <div
            v-if="location || !configStore.config.shouldUseLocation"
            class="flex gap-2 items-start mb-1"
        >
            <p
                class="my-0"
            >
                {{ configStore.config.shouldUseLocation ? `We think you are near ${location}` : 'Your location is not being used for predictions.' }}.
            </p>

            <button
                type="button"
                aria-label="Location settings"
                class="appButton appButton--secondary p-0 border-none bg-inherit text-ink-muted"
                @click="shouldShowSettingsPopup = true"
            >
                <AppIcon class="size-4 inline" name="settings" />
            </button>
        </div>
        <p v-if="explanation && configStore.config.shouldUseLocation">
            {{ explanation }}
        </p>
    </div>

    <AppModal
        :isOpen="shouldShowSettingsPopup"
        closeLabel="Close settings"
        @close="shouldShowSettingsPopup = false"
    >
        <template #header>Location</template>

        <div class="px-5 py-4 flex flex-col gap-2 items-start">
            <p v-if="!configStore.config.shouldUseLocation">
                Your location is not being used for predictions.
            </p>
            <p v-else-if="location">We think you are near {{ location }}.</p>
            <p
                v-if="journeySelectionStore.currentCoordinates"
                class="flex gap-2 items-baseline"
            >
                Your current coordinates are latitude
                <a
                    :href="`https://google.com/maps/search/?api=1&query=${journeySelectionStore.currentCoordinates?.latitude},${journeySelectionStore.currentCoordinates?.longitude}`"
                    target="_blank"
                    class="underline"
                >
                    <pre class="inline"
                        >{{
                            journeySelectionStore.currentCoordinates?.latitude
                        }}, {{
                            journeySelectionStore.currentCoordinates?.longitude
                        }}</pre>
                </a>
            </p>
            <label class="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    role="switch"
                    class="size-4 accent-primary"
                    :checked="configStore.config.shouldUseLocation"
                    data-test="location-predictions-toggle"
                    @change="
                        configStore.setShouldUseLocation(
                            ($event.target as HTMLInputElement).checked
                        )
                    "
                />
                Use location for predictions
            </label>
        </div>
    </AppModal>
</template>

<script setup lang="ts">
import type {JourneyPrediction} from "../../../journeys/journeyPrediction";
import {ref, computed} from "vue";
import {useDashboardConfigStore} from "@/trainDashboard/store/dashboardConfig.store.ts";
import AppIcon from "@/components/AppIcon.vue";
import AppModal from "@/components/Modal/AppModal.vue";
import {useJourneySelectionStore} from "@/trainDashboard/store/journeySelection.store.ts";

const props = defineProps<{
    prediction: JourneyPrediction;
    isPredicted: boolean;
}>();
const configStore = useDashboardConfigStore();
const journeySelectionStore = useJourneySelectionStore();

const shouldShowSettingsPopup = ref(false);

const location = computed(() => {
    const {nearbyStationGroupId} = props.prediction;
    const group = configStore.config.stationGroups.find(
        (group) => group.id === nearbyStationGroupId
    );

    return group ? group.name : null;
});

const explanation = computed(() => {
    const {reason, nearbyStationGroupId} = props.prediction;
    const group = configStore.config.stationGroups.find(
        (group) => group.id === nearbyStationGroupId
    );

    if (!props.isPredicted || !reason) {
        return null;
    }

    if (reason.type === "nearby") {
        return `Choose a journey below.`;
    }

    if (reason.type === "saved") {
        return group
            ? `This is your ${reason.onlyJourney ? "only" : "first"} saved journey from ${group.name}.`
            : null;
    }

    const schedule = configStore.config.schedules.find(
        (schedule) => schedule.id === reason.scheduleId
    );

    if (!schedule) {
        return null;
    }

    return !group || reason.timing === "active"
        ? `Your “${schedule.name}” schedule selects this journey.`
        : `"${schedule.name}" is your next schedule from ${group.name}.`;
});
</script>
