<template>
    <form
        ref="form"
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

        <SavedJourneysSettings
            v-else-if="activeEditorSection === 'journeys'"
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
import {
    dashboardConfigErrorMessages,
    DashboardConfigDraftSchema,
    type DashboardConfigDraft,
} from "../../dto/dashboardConfigDraft.dto";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../../store/journeySelection.store";
import SavedJourneysSettings from "./journeys/SavedJourneysSettings.vue";
import SchedulesSettings from "./schedules/SchedulesSettings.vue";
import StationGroupsSettings from "./stationGroups/StationGroupsSettings.vue";

const dashboardConfigStore = useDashboardConfigStore();
const selection = useJourneySelectionStore();
const recentJourneyIds = ref([...selection.recentJourneyIds]);
const form = ref<HTMLFormElement | null>(null);
const draft = ref<DashboardConfigDraft>(getConfigDraft());
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
    {value: "journeys", label: "Journeys", icon: "train" as const},
];
function getConfigDraft(): DashboardConfigDraft {
    // The stored configuration is JSON data. Its reactive proxies cannot use structuredClone.
    return JSON.parse(JSON.stringify(dashboardConfigStore.config));
}

function save(): void {
    const config = validateDraft();

    if (!config) {
        return;
    }

    for (const group of config.stationGroups) {
        if (group.coordinates) {
            group.coordinates.latitude = Number(
                group.coordinates.latitude.toFixed(4)
            );
            group.coordinates.longitude = Number(
                group.coordinates.longitude.toFixed(4)
            );
        }
    }

    const removedJourneyIds = dashboardConfigStore.config.journeys
        .filter(
            (journey) =>
                !config.journeys.some(
                    (candidate) => candidate.id === journey.id
                )
        )
        .map((journey) => journey.id);
    const activeJourneyId = selection.activeJourneyId;
    dashboardConfigStore.saveConfig(config);
    for (const journeyId of [...selection.recentJourneyIds]) {
        if (
            !recentJourneyIds.value.includes(journeyId) ||
            removedJourneyIds.includes(journeyId)
        ) {
            selection.removeRecentJourney(journeyId);
        }
    }
    if (activeJourneyId && removedJourneyIds.includes(activeJourneyId)) {
        selection.clearActiveJourney();
    } else if (
        selection.activeJourney.type === "ephemeral" &&
        config.journeys.some((journey) => journey.id === activeJourneyId)
    ) {
        selection.selectJourney(activeJourneyId!);
    }
    recentJourneyIds.value = [...selection.recentJourneyIds];
    draft.value = getConfigDraft();
    hasUnsavedChanges.value = false;
}

function cancel(): void {
    recentJourneyIds.value = [...selection.recentJourneyIds];
    draft.value = getConfigDraft();
    errors.value = [];
    hasUnsavedChanges.value = false;
    setValid(true);
}

function handleChange(): void {
    validateDraft();
    hasUnsavedChanges.value = true;
}

function validateDraft(): DashboardConfigDraft | undefined {
    const result = DashboardConfigDraftSchema.safeParse(draft.value);
    errors.value = result.success
        ? []
        : dashboardConfigErrorMessages(result.error);

    // Incomplete numbers have an empty value, but are not optional blank fields.
    for (const input of form.value?.querySelectorAll("input") ?? []) {
        if (input.validity.customError) {
            errors.value.push(input.validationMessage);
        } else if (input.validity.badInput) {
            const label = input.labels?.[0]?.textContent?.trim() ?? "Value";
            errors.value.push(`${label}: Enter a number.`);
        }
    }

    setValid(errors.value.length === 0);

    return result.success && errors.value.length === 0
        ? result.data
        : undefined;
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
