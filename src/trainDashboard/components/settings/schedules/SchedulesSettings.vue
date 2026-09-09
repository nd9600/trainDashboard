<template>
    <section
        id="journey-settings-panel-schedules"
        aria-labelledby="journey-settings-tab-schedules"
        role="tabpanel"
    >
        <ScheduleDetails
            v-if="selectedScheduleEntry"
            v-model:schedule="schedules[selectedScheduleEntry.index]!"
            v-model:journeys="journeys"
            :stationGroups="stationGroups"
            :schedules="schedules"
            @back="closeSchedule"
            @changed="emit('changed')"
            @remove="removeSchedule(selectedScheduleEntry.index)"
        />

        <div v-else class="space-y-4">
            <div>
                <h2 class="font-semibold">Priority schedules</h2>
                <p class="mt-1 text-sm text-ink-subtle">
                    Schedules can overlap, you can order them to prioritise which is picked. Location selects journeys from a
                    nearby group.
                </p>
            </div>

            <p
                v-if="stationGroups.length < 2"
                class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
                role="status"
            >
                Add at least two station groups before you create a journey.
            </p>

            <div
                v-for="(schedule, index) in schedules"
                :key="schedule.id"
                class="flex items-center gap-2"
            >
                <ScheduleSettingsCard
                    class="min-w-0 flex-1"
                    :schedule="schedule"
                    :journeys="journeys"
                    :stationGroups="stationGroups"
                    @edit="openSchedule(schedule.id)"
                />
                <div class="flex flex-col gap-1">
                    <button
                        class="appButton appButton--quiet appButton--icon"
                        type="button"
                        :aria-label="`Move ${schedule.name} up`"
                        title="Move up"
                        :disabled="index === 0"
                        data-test="move-schedule-up"
                        @click="moveSchedule(index, -1)"
                    >
                        <AppIcon class="size-4 -rotate-90" name="chevron" />
                    </button>
                    <button
                        class="appButton appButton--quiet appButton--icon"
                        type="button"
                        :aria-label="`Move ${schedule.name} down`"
                        title="Move down"
                        :disabled="index === schedules.length - 1"
                        data-test="move-schedule-down"
                        @click="moveSchedule(index, 1)"
                    >
                        <AppIcon class="size-4 rotate-90" name="chevron" />
                    </button>
                </div>
            </div>

            <button
                class="appButton appButton--secondary hover:bg-surface-muted"
                type="button"
                :disabled="stationGroups.length < 2"
                @click="addSchedule"
            >
                <AppIcon class="size-4" name="plus" />
                Add priority schedule
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import {computed, nextTick, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {DisplaySchedule} from "../../../dto/displaySchedule.dto";
import type {Journey} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import ScheduleDetails from "./ScheduleDetails.vue";
import ScheduleSettingsCard from "./ScheduleSettingsCard.vue";
import {createEmptyJourney, hasJourneyEndpoints} from "./scheduleSettings";

const props = defineProps<{
    stationGroups: StationGroup[];
}>();

const schedules = defineModel<DisplaySchedule[]>("schedules", {
    required: true,
});
const journeys = defineModel<Journey[]>("journeys", {required: true});
const selectedScheduleId = ref<string>();

const emit = defineEmits<{
    changed: [];
}>();

const selectedScheduleEntry = computed(() => {
    const index = schedules.value.findIndex(
        (schedule) => schedule.id === selectedScheduleId.value
    );

    return index === -1
        ? undefined
        : {schedule: schedules.value[index]!, index};
});

async function addSchedule(): Promise<void> {
    const journey = createEmptyJourney();
    const scheduleId = newId("schedule");

    journeys.value.push(journey);
    schedules.value = [
        ...schedules.value,
        {
            id: scheduleId,
            name: "?Morning commute?",
            days: [1, 2, 3, 4, 5],
            startsAt: "00:00",
            endsAt: "12:00",
            journeyId: journey.id,
        },
    ];
    emit("changed");
    await openSchedule(scheduleId);
}

function moveSchedule(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    const schedule = schedules.value[index];
    if (!schedule || nextIndex < 0 || nextIndex >= schedules.value.length)
        return;

    const reordered = [...schedules.value];
    reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, schedule);
    schedules.value = reordered;
    emit("changed");
}

async function openSchedule(scheduleId: string): Promise<void> {
    selectedScheduleId.value = scheduleId;
    await nextTick();
    document.getElementById(`schedule-${scheduleId}-name`)?.focus();
}

function closeSchedule(): void {
    selectedScheduleId.value = undefined;
}

function removeSchedule(scheduleIndex: number): void {
    const schedule = schedules.value[scheduleIndex]!;
    const otherSchedules = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    const journey = journeys.value.find(
        (candidate) => candidate.id === schedule.journeyId
    );
    const deleteIncompleteJourney =
        journey !== undefined &&
        !hasJourneyEndpoints(journey, props.stationGroups) &&
        !otherSchedules.some((candidate) => candidate.journeyId === journey.id);

    if (!window.confirm(`Remove schedule “${schedule.name}”?`)) {
        return;
    }

    schedules.value = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    if (deleteIncompleteJourney) {
        journeys.value = journeys.value.filter(
            (candidate) => candidate.id !== journey!.id
        );
    }
    closeSchedule();
    emit("changed");
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
