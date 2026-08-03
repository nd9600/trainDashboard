<template>
    <div class="space-y-4 rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="flex justify-between items-start gap-3">
            <label class="sentenceField">
                The
                <input
                    v-model="schedule.name"
                    class="appInput sentenceField__control w-fit"
                    required
                />
                schedule should be active on
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

        <fieldset class="sentenceField whitespace-normal flex-col items-start">
            <legend class="sr-only">Schedule days</legend>
            <div class="flex flex-wrap gap-2 sm:gap-4">
                <label
                    v-for="day in days"
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
                        class="rounded-full border border-line-strong bg-paper px-2.5 py-1 text-sm text-ink transition-colors hover:bg-surface-muted hover:border-surface-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
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

        <fieldset class="space-y-5 border-t border-line pt-4">
            <legend class="mb-3 font-semibold">Journey priorities</legend>

            <section class="space-y-2">
                <h4
                    class="inline-flex rounded-full bg-japonica px-2 py-0.5 text-sm font-bold tracking-wide text-white"
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
                    class="inline-flex rounded-full bg-saffron px-2 py-0.5 text-sm font-bold tracking-wide text-white"
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
</script>
