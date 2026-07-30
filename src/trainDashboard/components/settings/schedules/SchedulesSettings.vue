<template>
    <section
        id="journey-settings-panel-schedules"
        class="space-y-4"
        aria-labelledby="journey-settings-tab-schedules"
        role="tabpanel"
    >
        <div>
            <h2 class="font-semibold">Priority schedules</h2>
            <p class="mt-1 text-sm text-ink-subtle">
                A schedule controls which journeys are primary at a time of day.
            </p>
        </div>

        <ScheduleSettingsCard
            v-for="(schedule, scheduleIndex) in schedules"
            :key="schedule.id"
            v-model:schedule="schedules[scheduleIndex]!"
            :groups="groups"
            :pairs="pairs"
            @remove="removeSchedule(scheduleIndex)"
        />

        <button
            class="flex items-center gap-1.5 rounded border border-line-strong bg-paper px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
            type="button"
            @click="addSchedule"
        >
            <AppIcon class="size-4" name="plus" />
            Add priority schedule
        </button>
    </section>
</template>

<script setup lang="ts">
import type {
    DisplaySchedule,
    StationGroup,
    StationPair,
} from "../../../dto/dashboardConfig.dto";
import AppIcon from "@/components/AppIcon.vue";
import ScheduleSettingsCard from "./ScheduleSettingsCard.vue";

defineProps<{
    groups: StationGroup[];
    pairs: StationPair[];
}>();

const schedules = defineModel<DisplaySchedule[]>("schedules", {
    required: true,
});

const emit = defineEmits<{
    changed: [];
}>();

function addSchedule(): void {
    schedules.value = [
        ...schedules.value,
        {
            id: newId("schedule"),
            name: "New schedule",
            days: [1, 2, 3, 4, 5],
            startsAt: "09:00",
            endsAt: "17:00",
            primaryPairIds: [],
            secondaryPairIds: [],
        },
    ];
    emit("changed");
}

function removeSchedule(scheduleIndex: number): void {
    schedules.value = schedules.value.filter(
        (_, index) => index !== scheduleIndex
    );
    emit("changed");
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
