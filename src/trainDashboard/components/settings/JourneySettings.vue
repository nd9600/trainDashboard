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
            v-model:pairs="draft.pairs"
            :groups="draft.groups"
            @changed="handleChange"
            @remove="removePair"
        />
        <StationGroupsSettings
            v-else-if="activeEditorSection === 'groups'"
            v-model:groups="draft.groups"
            @changed="handleChange"
            @remove="removeGroup"
        />
        <WalkTimesSettings
            v-else-if="activeEditorSection === 'walk-times'"
            v-model:groups="draft.groups"
            @changed="handleChange"
        />
        <SchedulesSettings
            v-else-if="activeEditorSection === 'schedules'"
            v-model:schedules="draft.schedules"
            :groups="draft.groups"
            :pairs="draft.pairs"
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
import {useTrainDashboardStore} from "../../store/trainDashboard.store";
import JourneysSettings from "./journeys/JourneysSettings.vue";
import SchedulesSettings from "./schedules/SchedulesSettings.vue";
import StationGroupsSettings from "./stationGroups/StationGroupsSettings.vue";
import WalkTimesSettings from "./walkTimes/WalkTimesSettings.vue";

const configStore = useTrainDashboardStore();
const draft = ref<DashboardConfig>(cloneConfig(configStore.config));
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
    {value: "groups", label: "Station groups", icon: "map-pin" as const},
    {value: "walk-times", label: "Walk times", icon: "walk" as const},
    {value: "schedules", label: "Schedules", icon: "clock" as const},
];
function save(): void {
    if (!validateDraft()) {
        return;
    }

    const result = configStore.saveConfig(draft.value);
    errors.value = result.errors;

    if (result.success) {
        draft.value = cloneConfig(configStore.config);
        setHasUnsavedChanges(false);
        emit("saved");
    }
}

function cancel(): void {
    draft.value = cloneConfig(configStore.config);
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
    const groupId = draft.value.groups[groupIndex]!.id;
    const removedPairIds = draft.value.pairs
        .filter(
            (pair) =>
                referencesGroup(pair.origin, groupId) ||
                referencesGroup(pair.destination, groupId)
        )
        .map((pair) => pair.id);

    draft.value.groups.splice(groupIndex, 1);
    draft.value.pairs = draft.value.pairs.filter(
        (pair) => !removedPairIds.includes(pair.id)
    );
    removePairIdsFromSchedules(removedPairIds);
    handleChange();
}

function removePair(pairIndex: number): void {
    const pairId = draft.value.pairs[pairIndex]!.id;
    draft.value.pairs.splice(pairIndex, 1);
    removePairIdsFromSchedules([pairId]);
    handleChange();
}

function referencesGroup(
    location: LocationReference,
    groupId: string
): boolean {
    return location.type === "group" && location.groupId === groupId;
}

function removePairIdsFromSchedules(pairIds: string[]): void {
    for (const schedule of draft.value.schedules) {
        schedule.primaryPairIds = schedule.primaryPairIds.filter(
            (pairId) => !pairIds.includes(pairId)
        );
        schedule.secondaryPairIds = schedule.secondaryPairIds.filter(
            (pairId) => !pairIds.includes(pairId)
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
