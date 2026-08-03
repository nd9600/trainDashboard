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

        <JourneysSettings
            v-if="activeEditorSection === 'journeys'"
            v-model:journeys="draft.journeys"
            :stationGroups="draft.stationGroups"
            @changed="handleChange"
            @remove="removeJourney"
        />
        <StationGroupsSettings
            v-else-if="activeEditorSection === 'stationGroups'"
            v-model:stationGroups="draft.stationGroups"
            @changed="handleChange"
            @remove="removeGroup"
        />
        <WalkTimesSettings
            v-else-if="activeEditorSection === 'walk-times'"
            v-model:stationGroups="draft.stationGroups"
            @changed="handleChange"
        />
        <SchedulesSettings
            v-else-if="activeEditorSection === 'schedules'"
            v-model:schedules="draft.schedules"
            :stationGroups="draft.stationGroups"
            :journeys="draft.journeys"
            @changed="handleChange"
        />

        <div
            v-if="errors.length"
            class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
            role="alert"
        >
            <p class="font-semibold">The configuration was not saved.</p>
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
import type {
    DashboardConfig,
    LocationReference,
} from "../../dto/dashboardConfig.dto";
import {
    dashboardConfigErrorMessages,
    dashboardConfigSchema,
} from "../../dto/dashboardConfig.dto";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../journeys/journeyLabels";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import JourneysSettings from "./journeys/JourneysSettings.vue";
import SchedulesSettings from "./schedules/SchedulesSettings.vue";
import StationGroupsSettings from "./stationGroups/StationGroupsSettings.vue";
import WalkTimesSettings from "./walkTimes/WalkTimesSettings.vue";

const dashboardConfigStore = useDashboardConfigStore();
const draft = ref<DashboardConfig>(cloneConfig(dashboardConfigStore.config));
const errors = ref<string[]>([]);
const hasUnsavedChanges = defineModel<boolean>("hasUnsavedChanges", {
    default: false,
});
const isValid = ref(true);

const emit = defineEmits<{
    saved: [];
    validChange: [isValid: boolean];
}>();

const activeEditorSection = ref("journeys");
const editorSections = [
    {value: "journeys", label: "Journeys", icon: "train" as const},
    {value: "stationGroups", label: "Station groups", icon: "map-pin" as const},
    {value: "walk-times", label: "Walk times", icon: "walk" as const},
    {value: "schedules", label: "Schedules", icon: "clock" as const},
];
function save(): void {
    if (!validateDraft()) {
        return;
    }

    const result = dashboardConfigStore.saveConfig(draft.value);
    errors.value = result.errors;

    if (result.success) {
        draft.value = cloneConfig(dashboardConfigStore.config);
        setHasUnsavedChanges(false);
        emit("saved");
    }
}

function cancel(): void {
    draft.value = cloneConfig(dashboardConfigStore.config);
    errors.value = [];
    setHasUnsavedChanges(false);
    setValid(true);
}

function handleChange(): void {
    validateDraft();
    setHasUnsavedChanges(true);
}

function validateDraft(): boolean {
    const result = dashboardConfigSchema.safeParse(draft.value);
    errors.value = result.success
        ? []
        : dashboardConfigErrorMessages(result.error);
    setValid(result.success);

    return result.success;
}

function setHasUnsavedChanges(value: boolean): void {
    if (hasUnsavedChanges.value === value) {
        return;
    }

    hasUnsavedChanges.value = value;
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
                referencesGroup(journey.origin, groupId) ||
                referencesGroup(journey.destination, groupId)
        )
        .map((journey) => journey.id);

    const affectedScheduleCount = draft.value.schedules.filter((schedule) =>
        removedJourneyIds.some(
            (journeyId) =>
                schedule.primaryJourneyIds.includes(journeyId) ||
                schedule.secondaryJourneyIds.includes(journeyId)
        )
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

function removeJourney(journeyIndex: number): void {
    const journey = draft.value.journeys[journeyIndex]!;
    const journeyId = journey.id;

    if (
        !window.confirm(
            `Remove journey “${getJourneyLabelText(
                getJourneyLabelDetails(journey, draft.value.stationGroups)
            )}”?`
        )
    ) {
        return;
    }

    draft.value.journeys.splice(journeyIndex, 1);
    removeJourneyIdsFromSchedules([journeyId]);
    handleChange();
}

function referencesGroup(
    location: LocationReference,
    groupId: string
): boolean {
    return location.type === "group" && location.groupId === groupId;
}

function removeJourneyIdsFromSchedules(journeyIds: string[]): void {
    for (const schedule of draft.value.schedules) {
        schedule.primaryJourneyIds = schedule.primaryJourneyIds.filter(
            (journeyId) => !journeyIds.includes(journeyId)
        );
        schedule.secondaryJourneyIds = schedule.secondaryJourneyIds.filter(
            (journeyId) => !journeyIds.includes(journeyId)
        );
    }
}

function cloneConfig(config: DashboardConfig): DashboardConfig {
    return JSON.parse(JSON.stringify(config)) as DashboardConfig;
}

defineExpose({
    cancel,
    save,
});
</script>
