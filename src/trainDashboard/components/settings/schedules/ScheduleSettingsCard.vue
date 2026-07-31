<template>
    <div class="space-y-4 rounded-lg border border-line bg-paper p-4 shadow-sm">
        <label class="sentenceField">
            Call this schedule
            <input
                v-model="schedule.name"
                class="appInput sentenceField__control min-w-52 grow"
                required
            />
        </label>

        <fieldset>
            <legend>Use this schedule on</legend>
            <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <label
                    v-for="day in days"
                    :key="day.value"
                    class="flex items-center gap-1 text-sm"
                >
                    <input
                        v-model="schedule.days"
                        class="size-4 accent-primary"
                        type="checkbox"
                        :value="day.value"
                    />
                    {{ day.label }}
                </label>
            </div>
        </fieldset>

        <fieldset class="sentenceField">
            <legend class="sr-only">Schedule times</legend>
            <label class="inline-flex items-baseline gap-2">
                <span>This schedule runs from</span>
                <input
                    v-model="schedule.startsAt"
                    class="appInput sentenceField__control w-24"
                    inputmode="numeric"
                    pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                    placeholder="HH:MM"
                    required
                    title="Enter a time from 00:00 to 24:00."
                />
            </label>
            <label class="inline-flex items-baseline gap-2">
                <span>until</span>
                <input
                    v-model="schedule.endsAt"
                    class="appInput sentenceField__control w-24"
                    inputmode="numeric"
                    pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                    placeholder="HH:MM"
                    required
                    title="Enter a time from 00:00 to 24:00."
                />
            </label>
        </fieldset>

        <fieldset class="mt-12 space-y-3">
            <legend class="mb-1 font-semibold">
                Set how each journey appears
            </legend>
            <label
                v-for="journey in journeys"
                :key="journey.id"
                class="sentenceField"
                :class="
                    journeyPriority(journey.id) === 'hidden' ? 'opacity-50' : ''
                "
            >
                <span
                    class="size-6 text-white rounded-full flex justify-center items-center font-bold"
                    :class="{
                        'bg-japonica':
                            journeyPriority(journey.id) === 'primary',
                        'bg-saffron':
                            journeyPriority(journey.id) === 'secondary',
                        'bg-casa': journeyPriority(journey.id) === 'hidden',
                    }"
                >
                    {{
                        journeyPriority(journey.id) === "primary"
                            ? 1
                            : journeyPriority(journey.id) === "secondary"
                              ? 2
                              : ""
                    }}
                </span>
                <span class="font-medium">
                    {{ journeyName(journey, stationGroups) }}
                </span>
                <span>is</span>
                <select
                    class="appInput sentenceField__control min-w-52 grow"
                    :value="journeyPriority(journey.id)"
                    @change="updateJourneyPriority(journey.id, $event)"
                >
                    <option value="primary">a primary journey</option>
                    <option value="secondary">
                        shown under Other journeys
                    </option>
                    <option value="hidden">hidden during this schedule</option>
                </select>
            </label>
        </fieldset>

        <button
            class="appButton appButton--danger px-2 py-1"
            type="button"
            @click="emit('remove')"
        >
            <AppIcon class="size-4" name="trash" />
            Remove schedule
        </button>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {
    Day,
    DisplaySchedule,
    StationGroup,
    Journey,
} from "../../../dto/dashboardConfig.dto";
import {journeyName} from "../../../presentation/settingsPresentation";

defineProps<{
    stationGroups: StationGroup[];
    journeys: Journey[];
}>();

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});

const emit = defineEmits<{
    remove: [];
}>();

type PairPriority = "hidden" | "primary" | "secondary";

const days: Array<{value: Day; label: string}> = [
    {value: 1, label: "Monday"},
    {value: 2, label: "Tuesday"},
    {value: 3, label: "Wednesday"},
    {value: 4, label: "Thursday"},
    {value: 5, label: "Friday"},
    {value: 6, label: "Saturday"},
    {value: 0, label: "Sunday"},
];

function journeyPriority(journeyId: string): PairPriority {
    if (schedule.value.primaryJourneyIds.includes(journeyId)) {
        return "primary";
    }

    if (schedule.value.secondaryJourneyIds.includes(journeyId)) {
        return "secondary";
    }

    return "hidden";
}

function updateJourneyPriority(journeyId: string, event: Event): void {
    const priority = (event.target as HTMLSelectElement).value as PairPriority;

    schedule.value.primaryJourneyIds = schedule.value.primaryJourneyIds.filter(
        (selectedPairId) => selectedPairId !== journeyId
    );
    schedule.value.secondaryJourneyIds =
        schedule.value.secondaryJourneyIds.filter(
            (selectedPairId) => selectedPairId !== journeyId
        );

    if (priority === "primary") {
        schedule.value.primaryJourneyIds.push(journeyId);
    }

    if (priority === "secondary") {
        schedule.value.secondaryJourneyIds.push(journeyId);
    }
}
</script>
