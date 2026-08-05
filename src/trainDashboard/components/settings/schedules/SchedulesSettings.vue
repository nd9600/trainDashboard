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
            @removeJourney="
                removeJourneyFromSchedule(selectedScheduleEntry.index, $event)
            "
        />

        <div v-else class="space-y-4">
            <div>
                <h2 class="font-semibold">Priority schedules</h2>
                <p class="mt-1 text-sm text-ink-subtle">
                    A schedule says which journeys are prioritised at that time
                    of day.
                </p>
            </div>

            <p
                v-if="stationGroups.length < 2"
                class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
                role="status"
            >
                Add at least two station groups before you create a journey.
            </p>

            <ScheduleSettingsCard
                v-for="schedule in schedules"
                :key="schedule.id"
                :schedule="schedule"
                :journeys="journeys"
                :stationGroups="stationGroups"
                @edit="selectedScheduleId = schedule.id"
            />

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
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {
    DisplaySchedule,
    StationGroup,
    Journey,
} from "../../../dto/dashboardConfig.dto";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../../journeys/journeyLabels";
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

function addSchedule(): void {
    const journey = createEmptyJourney();
    const scheduleId = newId("schedule");

    journeys.value.push(journey);
    schedules.value = [
        ...schedules.value,
        {
            id: scheduleId,
            name: "Morning commute",
            days: [1, 2, 3, 4, 5],
            startsAt: "00:00",
            endsAt: "12:00",
            primaryJourneyId: journey.id,
            secondaryJourneyIds: [],
        },
    ];
    selectedScheduleId.value = scheduleId;
    emit("changed");
}

function closeSchedule(): void {
    selectedScheduleId.value = undefined;
}

function removeSchedule(scheduleIndex: number): void {
    const schedule = schedules.value[scheduleIndex]!;
    const otherSchedules = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    const journeyIds = [
        schedule.primaryJourneyId,
        ...schedule.secondaryJourneyIds,
    ];
    const deletedJourneys = journeys.value.filter(
        (journey) =>
            journeyIds.includes(journey.id) &&
            !otherSchedules.some((candidate) =>
                scheduleUsesJourney(candidate, journey.id)
            )
    );
    const deletionMessage = deletedJourneys.length
        ? ` The following ${deletedJourneys.length === 1 ? "journey" : "journeys"} will also be deleted because no other schedule uses ${deletedJourneys.length === 1 ? "it" : "them"}: ${deletedJourneys.map((journey) => `“${journeyLabel(journey)}”`).join("; ")}.`
        : "";

    if (
        !window.confirm(`Remove schedule “${schedule.name}”?${deletionMessage}`)
    ) {
        return;
    }

    schedules.value = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    const deletedJourneyIds = deletedJourneys.map((journey) => journey.id);
    journeys.value = journeys.value.filter(
        (journey) => !deletedJourneyIds.includes(journey.id)
    );
    closeSchedule();
    emit("changed");
}

function removeJourneyFromSchedule(
    scheduleIndex: number,
    journeyId: string
): void {
    const schedule = schedules.value[scheduleIndex]!;

    if (schedule.primaryJourneyId === journeyId) {
        return;
    }

    const journey = journeys.value.find(
        (candidate) => candidate.id === journeyId
    )!;
    const otherSchedules = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    const schedulesUsingJourney = otherSchedules.filter((candidate) =>
        scheduleUsesJourney(candidate, journeyId)
    );
    const consequence = schedulesUsingJourney.length
        ? ""
        : " It will be deleted because no other schedule uses it.";

    if (
        !window.confirm(
            `Remove journey “${journeyLabel(journey)}” from “${schedule.name}”?${consequence}`
        )
    ) {
        return;
    }

    schedule.secondaryJourneyIds = schedule.secondaryJourneyIds.filter(
        (candidate) => candidate !== journeyId
    );

    if (schedulesUsingJourney.length === 0) {
        journeys.value = journeys.value.filter(
            (candidate) => candidate.id !== journeyId
        );
    }

    emit("changed");
}

function scheduleUsesJourney(
    schedule: DisplaySchedule,
    journeyId: string
): boolean {
    return (
        schedule.primaryJourneyId === journeyId ||
        schedule.secondaryJourneyIds.includes(journeyId)
    );
}

function journeyLabel(journey: Journey): string {
    if (!hasJourneyEndpoints(journey, props.stationGroups)) {
        return "New journey";
    }

    return getJourneyLabelText(
        getJourneyLabelDetails(journey, props.stationGroups)
    );
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
