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
            <legend class="mb-1 font-semibold">Set how each journey appears</legend>
            <label
                v-for="pair in pairs"
                :key="pair.id"
                class="sentenceField"
                :class="pairPriority(pair.id) === 'hidden' ? 'opacity-50' : ''"
            >
                <span
                    class="size-6  text-white rounded-full flex justify-center items-center font-bold"
                    :class="{
                        'bg-japonica': pairPriority(pair.id) === 'primary',
                        'bg-saffron': pairPriority(pair.id) === 'secondary',
                        'bg-casa': pairPriority(pair.id) === 'hidden',
                    }"
                >
                    {{ pairPriority(pair.id) === 'primary' ? 1 : pairPriority(pair.id) === 'secondary' ? 2 : '' }}
                </span>
                <span class="font-medium">
                    {{ stationPairName(pair, groups) }}
                </span>
                <span>is</span>
                <select
                    class="appInput sentenceField__control min-w-52 grow"
                    :value="pairPriority(pair.id)"
                    @change="updatePairPriority(pair.id, $event)"
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
    StationPair,
} from "../../../dto/dashboardConfig.dto";
import {stationPairName} from "../../../presentation/settingsPresentation";

defineProps<{
    groups: StationGroup[];
    pairs: StationPair[];
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

function pairPriority(pairId: string): PairPriority {
    if (schedule.value.primaryPairIds.includes(pairId)) {
        return "primary";
    }

    if (schedule.value.secondaryPairIds.includes(pairId)) {
        return "secondary";
    }

    return "hidden";
}

function updatePairPriority(pairId: string, event: Event): void {
    const priority = (event.target as HTMLSelectElement).value as PairPriority;

    schedule.value.primaryPairIds = schedule.value.primaryPairIds.filter(
        (selectedPairId) => selectedPairId !== pairId
    );
    schedule.value.secondaryPairIds = schedule.value.secondaryPairIds.filter(
        (selectedPairId) => selectedPairId !== pairId
    );

    if (priority === "primary") {
        schedule.value.primaryPairIds.push(pairId);
    }

    if (priority === "secondary") {
        schedule.value.secondaryPairIds.push(pairId);
    }
}
</script>
