<template>
    <section class="space-y-4">
        <h3 class="font-semibold">Schedule details</h3>

        <label class="sentenceField">
            The
            <input
                v-model="schedule.name"
                class="appInput sentenceField__control w-fit"
                required
            />
            schedule should be active on
        </label>

        <fieldset class="sentenceField flex-col items-start whitespace-normal">
            <legend class="sr-only">Schedule days</legend>
            <div class="flex flex-wrap gap-2 sm:gap-4">
                <label
                    v-for="day in scheduleDays"
                    :key="day.value"
                    class="inline-flex cursor-pointer"
                >
                    <input
                        v-model="schedule.days"
                        class="peer sr-only"
                        type="checkbox"
                        :value="day.value"
                    />
                    <span
                        class="rounded-full border border-line-strong bg-paper px-2.5 py-1 text-sm text-ink transition-colors hover:border-surface-muted hover:bg-surface-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
                    >
                        {{ day.label }}
                    </span>
                </label>
            </div>
        </fieldset>

        <fieldset class="sentenceField whitespace-normal">
            <legend class="sr-only">Schedule times</legend>
            <label class="inline-flex items-baseline gap-2">
                <span>from</span>
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
    </section>
</template>

<script setup lang="ts">
import type {DisplaySchedule} from "../../../dto/dashboardConfig.dto";
import {scheduleDays} from "./scheduleSettings";

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});
</script>
