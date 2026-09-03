<template>
    <form
        class="space-y-6"
        @change="handleChange"
        @input="handleChange"
        @submit.prevent="save"
    >
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

        <div
            v-if="errors.length"
            class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
            role="alert"
        >
            <p class="font-semibold">The configuration can't be saved.</p>
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
import type {DashboardConfig} from "../../dto/dashboardConfig.dto";
import {
    dashboardConfigErrorMessages,
    DashboardConfigSchema,
} from "../../dto/dashboardConfig.dto";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import SchedulesSettings from "./schedules/SchedulesSettings.vue";
import StationGroupsSettings from "./stationGroups/StationGroupsSettings.vue";

const dashboardConfigStore = useDashboardConfigStore();
const draft = ref<DashboardConfig>(
    structuredClone(dashboardConfigStore.config)
);
const errors = ref<string[]>([]);
const hasUnsavedChanges = defineModel<boolean>("hasUnsavedChanges", {
    default: false,
});
const isValid = ref(true);

const emit = defineEmits<{
    validChange: [isValid: boolean];
}>();

const activeEditorSection = ref("stationGroups");
const editorSections = [
    {value: "stationGroups", label: "Stations", icon: "map-pin" as const},
    {value: "schedules", label: "Schedules", icon: "clock" as const},
];
function save(): void {
    if (!validateDraft()) {
        return;
    }

    const result = dashboardConfigStore.saveConfig(draft.value);
    errors.value = result.errors;

    if (result.success) {
        draft.value = structuredClone(dashboardConfigStore.config);
        hasUnsavedChanges.value = false;
    }
}

function cancel(): void {
    draft.value = structuredClone(dashboardConfigStore.config);
    errors.value = [];
    hasUnsavedChanges.value = false;
    setValid(true);
}

function handleChange(): void {
    validateDraft();
    hasUnsavedChanges.value = true;
}

function validateDraft(): boolean {
    const result = DashboardConfigSchema.safeParse(draft.value);
    errors.value = result.success
        ? []
        : dashboardConfigErrorMessages(result.error);
    setValid(result.success);

    return result.success;
}

function setValid(value: boolean): void {
    if (isValid.value === value) {
        return;
    }

    isValid.value = value;
    emit("validChange", value);
}

function removeGroup(groupIndex: number): void {
    const group = draft.value.stationGroups[groupIndex]!;
    const groupId = group.id;
    const removedJourneyIds = draft.value.journeys
        .filter(
            (journey) =>
                journey.origin.groupId === groupId ||
                journey.destination.groupId === groupId
        )
        .map((journey) => journey.id);

    const affectedScheduleCount = draft.value.schedules.filter((schedule) =>
        removedJourneyIds.some((journeyId) => schedule.journeyId === journeyId)
    ).length;

    const consequence = removedJourneyIds.length
        ? ` This will also remove ${removedJourneyIds.length} journey${removedJourneyIds.length === 1 ? "" : "s"} and update ${affectedScheduleCount} schedule${affectedScheduleCount === 1 ? "" : "s"}.`
        : "";

    if (
        !window.confirm(`Remove station group “${group.name}”?${consequence}`)
    ) {
        return;
    }

    draft.value.stationGroups.splice(groupIndex, 1);
    draft.value.journeys = draft.value.journeys.filter(
        (journey) => !removedJourneyIds.includes(journey.id)
    );
    removeJourneyIdsFromSchedules(removedJourneyIds);
    handleChange();
}

function removeJourneyIdsFromSchedules(journeyIds: string[]): void {
    for (const schedule of draft.value.schedules) {
        if (journeyIds.includes(schedule.journeyId)) {
            schedule.journeyId = "";
        }
    }
}

defineExpose({
    cancel,
    save,
});
</script>
