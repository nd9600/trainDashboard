<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div
            class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]"
        >
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">
                    Schedule name
                </span>
                <input
                    v-model="schedule.name"
                    class="w-full rounded border border-line-strong bg-paper px-2 py-1.5"
                    required
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">Start</span>
                <input
                    v-model="schedule.startsAt"
                    class="w-full rounded border border-line-strong bg-paper px-2 py-1.5"
                    inputmode="numeric"
                    pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                    placeholder="HH:MM"
                    required
                    title="Enter a time from 00:00 to 24:00."
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">End</span>
                <input
                    v-model="schedule.endsAt"
                    class="w-full rounded border border-line-strong bg-paper px-2 py-1.5"
                    inputmode="numeric"
                    pattern="(?:(?:[01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                    placeholder="HH:MM"
                    required
                    title="Enter a time from 00:00 to 24:00."
                />
            </label>
            <button
                class="flex items-center gap-1.5 px-2 py-1 text-sm text-danger hover:underline"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                Remove
            </button>
        </div>

        <fieldset class="mt-3">
            <legend class="text-xs text-ink-subtle">Days</legend>
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

        <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <fieldset>
                <legend class="text-xs text-ink-subtle">
                    Primary journeys
                </legend>
                <label
                    v-for="pair in pairs"
                    :key="pair.id"
                    class="mt-1 flex items-center gap-2 text-sm"
                >
                    <input
                        v-model="schedule.primaryPairIds"
                        class="size-4 accent-primary"
                        type="checkbox"
                        :value="pair.id"
                        :disabled="schedule.secondaryPairIds.includes(pair.id)"
                    />
                    {{ stationPairName(pair, groups) }}
                </label>
            </fieldset>
            <fieldset>
                <legend class="text-xs text-ink-subtle">
                    Secondary journeys
                </legend>
                <label
                    v-for="pair in pairs"
                    :key="pair.id"
                    class="mt-1 flex items-center gap-2 text-sm"
                >
                    <input
                        v-model="schedule.secondaryPairIds"
                        class="size-4 accent-primary"
                        type="checkbox"
                        :value="pair.id"
                        :disabled="schedule.primaryPairIds.includes(pair.id)"
                    />
                    {{ stationPairName(pair, groups) }}
                </label>
            </fieldset>
        </div>
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

const days: Array<{value: Day; label: string}> = [
    {value: 1, label: "Mon"},
    {value: 2, label: "Tue"},
    {value: 3, label: "Wed"},
    {value: 4, label: "Thu"},
    {value: 5, label: "Fri"},
    {value: 6, label: "Sat"},
    {value: 0, label: "Sun"},
];
</script>
