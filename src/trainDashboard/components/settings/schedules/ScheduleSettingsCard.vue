<template>
    <details
        class="group rounded-lg border border-line bg-paper shadow-sm"
        :open="isOpen"
        @toggle="updateOpenState"
    >
        <summary class="flex cursor-pointer list-none items-center gap-3 p-4">
            <AppIcon
                class="size-4 shrink-0 transition-transform group-open:rotate-90"
                name="chevron"
            />
            <span class="min-w-0">
                <strong class="block truncate">
                    {{ schedule.name || "Unnamed schedule" }}
                </strong>
                <span class="block text-xs text-ink-subtle">
                    {{ activeDaysText }} · {{ schedule.startsAt }}–{{ schedule.endsAt }}
                </span>
                <span
                    v-if="primaryJourneyIsComplete"
                    class="mt-1 block truncate text-sm"
                >
                    Primary:
                    <JourneyLabel
                        :details="
                            getJourneyLabelDetails(
                                primaryJourney!,
                                stationGroups
                            )
                        "
                    />
                </span>
            </span>
        </summary>

        <div class="space-y-5 border-t border-line p-4">
            <ScheduleTimingSettings
                v-model:schedule="schedule"
                @remove="emit('remove')"
            />

            <PrimaryJourneySettings
                v-model:schedule="schedule"
                v-model:journeys="journeys"
                :stationGroups="stationGroups"
                :schedules="schedules"
                @changed="emit('changed')"
            />

            <OtherJourneySettings
                v-model:schedule="schedule"
                v-model:journeys="journeys"
                :stationGroups="stationGroups"
                :schedules="schedules"
                @changed="emit('changed')"
                @removeJourney="emit('removeJourney', $event)"
            />
        </div>
    </details>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {
    DisplaySchedule,
    Journey,
    StationGroup,
} from "../../../dto/dashboardConfig.dto";
import {getJourneyLabelDetails} from "../../../journeys/journeyLabels";
import JourneyLabel from "../../journeys/JourneyLabel.vue";
import OtherJourneySettings from "./OtherJourneySettings.vue";
import PrimaryJourneySettings from "./PrimaryJourneySettings.vue";
import ScheduleTimingSettings from "./ScheduleTimingSettings.vue";
import {getActiveDaysText, hasJourneyEndpoints} from "./scheduleSettings";

const props = withDefaults(
    defineProps<{
        stationGroups: StationGroup[];
        schedules: DisplaySchedule[];
        initiallyOpen?: boolean;
    }>(),
    {initiallyOpen: false}
);

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});
const journeys = defineModel<Journey[]>("journeys", {required: true});
const isOpen = ref(props.initiallyOpen);

const emit = defineEmits<{
    changed: [];
    remove: [];
    removeJourney: [journeyId: string];
}>();

const primaryJourney = computed(() =>
    journeys.value.find(
        (journey) => journey.id === schedule.value.primaryJourneyId
    )
);
const primaryJourneyIsComplete = computed(
    () =>
        primaryJourney.value !== undefined &&
        hasJourneyEndpoints(primaryJourney.value, props.stationGroups)
);
const activeDaysText = computed(() => getActiveDaysText(schedule.value.days));

function updateOpenState(event: Event): void {
    isOpen.value = (event.target as HTMLDetailsElement).open;
}
</script>
