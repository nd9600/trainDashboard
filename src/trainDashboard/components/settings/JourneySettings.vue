<template>
    <form
        ref="form"
        class="space-y-6"
        @change="handleChange"
        @input="handleChange"
        @submit.prevent="save"
    >
        <label class="flex items-center gap-2 text-sm">
            <input
                v-model="draft.shouldUseLocation"
                type="checkbox"
                role="switch"
                class="size-4 accent-primary"
                data-test="location-predictions-toggle"
            />
            Use location for predictions
        </label>

        <AppTabs
            idPrefix="journey-settings"
            v-model="activeEditorSection"
            :tabs="editorSections"
            variant="card"
        />

        <StationGroupsSettings
            v-if="activeEditorSection === 'stationGroups'"
            v-model:stationGroups="draft.stationGroups"
            @changed="handleChange"
            @remove="removeGroup"
        />
        <SchedulesSettings
            v-else-if="activeEditorSection === 'schedules'"
            v-model:schedules="draft.schedules"
            v-model:journeys="draft.journeys"
            :stationGroups="draft.stationGroups"
            @changed="handleChange"
        />

        <SavedJourneysSettings
            v-else-if="activeEditorSection === 'savedJourneys'"
            v-model:journeys="draft.journeys"
            v-model:recentJourneyIds="recentJourneyIds"
            :stationGroups="draft.stationGroups"
            :schedules="draft.schedules"
            @changed="handleChange"
        />

        <div
            v-if="errors.length"
            class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
            role="alert"
        >
            <p class="font-semibold">The configuration cannot be saved.</p>
            <ul class="mt-1 list-disc pl-5">
                <li v-for="error in errors" :key="error">
                    {{ error }}
                </li>
            </ul>
        </div>
    </form>
</template>

<script setup lang="ts">
import {ref} from "vue";
import AppTabs from "@/components/AppTabs.vue";
import SavedJourneysSettings from "./journeys/SavedJourneysSettings.vue";
import SchedulesSettings from "./schedules/SchedulesSettings.vue";
import StationGroupsSettings from "./stationGroups/StationGroupsSettings.vue";
import {useJourneySettingsDraft} from "./useJourneySettingsDraft";

const hasUnsavedChanges = defineModel<boolean>("hasUnsavedChanges", {default: false});
const emit = defineEmits<{validChange: [isValid: boolean]}>();
const {draft, recentJourneyIds, form, errors, save, cancel, handleChange, removeGroup} =
    useJourneySettingsDraft(hasUnsavedChanges, (valid) => emit("validChange", valid));
const activeEditorSection = ref("stationGroups");
const editorSections = [
    {value: "stationGroups", label: "Stations", icon: "map-pin" as const},
    {value: "schedules", label: "Schedules", icon: "clock" as const},
    {value: "savedJourneys", label: "Saved Journeys", icon: "train" as const},
];

defineExpose({cancel, save});
</script>
