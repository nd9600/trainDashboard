<template>
    <div class="space-y-6">
        <header>
            <button
                class="appButton appButton--quiet mb-3 px-0 py-1 text-sm text-primary"
                type="button"
                @click="emit('back')"
            >
                <AppIcon class="size-3 rotate-180" name="chevron" />
                All schedules
            </button>
            <h2 class="font-display text-xl">
                {{ schedule.name || "Unnamed schedule" }}
            </h2>
            <p class="text-sm text-ink-subtle">
                {{ getActiveDaysText(schedule.days) }} ·
                {{ schedule.startsAt }}–{{ schedule.endsAt }}
            </p>
        </header>

        <ScheduleTimingSettings v-model:schedule="schedule" />

        <SchedulePrimaryJourney
            v-model:schedule="schedule"
            v-model:journeys="journeys"
            :stationGroups="stationGroups"
            :schedules="schedules"
            @changed="emit('changed')"
        />

        <ScheduleOtherJourneys
            v-model:schedule="schedule"
            v-model:journeys="journeys"
            :stationGroups="stationGroups"
            :schedules="schedules"
            @changed="emit('changed')"
            @removeJourney="emit('removeJourney', $event)"
        />

        <div class="border-t border-line pt-5">
            <button
                class="appButton appButton--quiet px-0 py-1 text-danger hover:text-danger-dark"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                Remove schedule
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {
    DisplaySchedule,
    Journey,
    StationGroup,
} from "../../../dto/dashboardConfig.dto";
import ScheduleOtherJourneys from "./ScheduleOtherJourneys.vue";
import SchedulePrimaryJourney from "./SchedulePrimaryJourney.vue";
import ScheduleTimingSettings from "./ScheduleTimingSettings.vue";
import {getActiveDaysText} from "./scheduleSettings";

defineProps<{
    stationGroups: StationGroup[];
    schedules: DisplaySchedule[];
}>();

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});
const journeys = defineModel<Journey[]>("journeys", {required: true});

const emit = defineEmits<{
    back: [];
    changed: [];
    remove: [];
    removeJourney: [journeyId: string];
}>();
</script>
