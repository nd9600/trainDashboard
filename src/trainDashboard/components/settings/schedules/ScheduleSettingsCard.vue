<template>
    <div class="space-y-4 rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="flex items-start gap-3">
            <label class="sentenceField grow">
                Call this schedule
                <input
                    v-model="schedule.name"
                    class="appInput sentenceField__control min-w-52 grow"
                    required
                />
            </label>
            <button
                class="appButton appButton--quiet shrink-0 px-2 py-1 text-danger hover:text-danger-dark"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                <span class="max-sm:sr-only">Remove schedule</span>
            </button>
        </div>

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

        <p class="text-sm font-medium text-ink-muted">
            {{ activeDaysText }} · {{ schedule.startsAt }}–{{ schedule.endsAt }}
        </p>

        <fieldset class="space-y-5 border-t border-line pt-4">
            <legend class="mb-3 font-semibold">Journey priorities</legend>

            <section class="space-y-2">
                <h4
                    class="inline-flex rounded-full bg-japonica px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                >
                    Primary
                </h4>
                <p
                    v-if="primaryJourneys.length === 0"
                    class="text-sm text-ink-subtle"
                >
                    No primary journey is selected.
                </p>
                <ScheduleJourneyPriorityInput
                    v-for="journey in primaryJourneys"
                    :key="journey.id"
                    :journey="journey"
                    :stationGroups="stationGroups"
                    priority="primary"
                    @priorityChange="updateJourneyPriority(journey.id, $event)"
                />
            </section>

            <section class="space-y-2">
                <h4
                    class="inline-flex rounded-full bg-saffron px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink"
                >
                    Other journeys
                </h4>
                <p
                    v-if="secondaryJourneys.length === 0"
                    class="text-sm text-ink-subtle"
                >
                    No other journeys are selected.
                </p>
                <ScheduleJourneyPriorityInput
                    v-for="journey in secondaryJourneys"
                    :key="journey.id"
                    :journey="journey"
                    :stationGroups="stationGroups"
                    priority="secondary"
                    @priorityChange="updateJourneyPriority(journey.id, $event)"
                />
            </section>

            <details v-if="hiddenJourneys.length" class="group">
                <summary
                    class="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink-muted"
                >
                    <AppIcon
                        class="size-4 transition-transform group-open:rotate-90"
                        name="chevron"
                    />
                    {{ hiddenJourneys.length }} hidden
                    {{ hiddenJourneys.length === 1 ? "journey" : "journeys" }}
                </summary>
                <div class="mt-3 space-y-3">
                    <ScheduleJourneyPriorityInput
                        v-for="journey in hiddenJourneys"
                        :key="journey.id"
                        class="opacity-50"
                        :journey="journey"
                        :stationGroups="stationGroups"
                        priority="hidden"
                        @priorityChange="
                            updateJourneyPriority(journey.id, $event)
                        "
                    />
                </div>
            </details>
        </fieldset>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {
    Day,
    DisplaySchedule,
    StationGroup,
    Journey,
} from "../../../dto/dashboardConfig.dto";
import ScheduleJourneyPriorityInput from "./ScheduleJourneyPriorityInput.vue";

const props = defineProps<{
    stationGroups: StationGroup[];
    journeys: Journey[];
}>();

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});

const emit = defineEmits<{
    remove: [];
}>();

const activeDaysText = computed(() => getActiveDaysText(schedule.value.days));

const primaryJourneys = computed(() =>
    props.journeys.filter((journey) =>
        schedule.value.primaryJourneyIds.includes(journey.id)
    )
);

const secondaryJourneys = computed(() =>
    props.journeys.filter((journey) =>
        schedule.value.secondaryJourneyIds.includes(journey.id)
    )
);

const hiddenJourneys = computed(() =>
    props.journeys.filter((journey) => journeyPriority(journey.id) === "hidden")
);

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

function updateJourneyPriority(
    journeyId: string,
    priority: PairPriority
): void {
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

function getActiveDaysText(activeDays: Day[]): string {
    const selectedDays = days.filter((day) => activeDays.includes(day.value));

    if (selectedDays.length === 0) {
        return "No days selected";
    }

    if (selectedDays.length === days.length) {
        return "Every day";
    }

    const ranges: Array<(typeof days)[number][]> = [];

    selectedDays.forEach((day) => {
        const currentRange = ranges.at(-1);
        const previousDay = currentRange?.at(-1);
        const daysAreConsecutive =
            previousDay && days.indexOf(day) === days.indexOf(previousDay) + 1;

        if (currentRange && daysAreConsecutive) {
            currentRange.push(day);
            return;
        }

        ranges.push([day]);
    });

    return ranges
        .map((range) => {
            const firstDay = range.at(0)!;
            const lastDay = range.at(-1)!;

            return range.length === 1
                ? firstDay.label
                : `${firstDay.label}–${lastDay.label}`;
        })
        .join(", ");
}
</script>
