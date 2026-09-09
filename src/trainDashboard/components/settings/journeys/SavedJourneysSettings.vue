<template>
    <section
        id="journey-settings-panel-journeys"
        aria-labelledby="journey-settings-tab-journeys"
        role="tabpanel"
        class="space-y-6"
    >
        <section class="space-y-3">
            <h2 class="font-semibold">Saved journeys</h2>
            <p v-if="journeys.length === 0" class="text-sm text-ink-subtle">
                No saved journeys.
            </p>
            <div
                v-for="(journey, index) in journeys"
                :key="journey.id"
                class="rounded-lg border border-line bg-paper p-3"
                data-test="saved-journey"
            >
                <div class="flex items-start justify-between gap-2">
                    <JourneyLabel
                        v-if="hasJourneyEndpoints(journey, stationGroups)"
                        :details="
                            getJourneyLabelDetails(journey, stationGroups)
                        "
                    />
                    <span v-else>Choose journey stations</span>
                    <div class="flex gap-2">
                        <button
                            class="appButton appButton--secondary text-xs py-1"
                            type="button"
                            @click="
                                editingJourneyId =
                                    editingJourneyId === journey.id
                                        ? undefined
                                        : journey.id
                            "
                        >
                            {{ editingJourneyId === journey.id ? "Done" : "Edit" }}
                        </button>
                        <button
                            class="appButton appButton--danger text-xs px-0 py-1"
                            type="button"
                            :disabled="
                                getScheduleNamesUsingJourney(
                                    journey.id,
                                    schedules
                                ).length > 0
                            "
                            @click="removeJourney(journey.id)"
                        >
                            Remove
                        </button>
                    </div>
                </div>
                <p
                    v-if="getScheduleNamesUsingJourney(journey.id, schedules).length"
                    class="mt-2 text-xs text-ink-subtle"
                >
                    Used by:
                    {{ getScheduleNamesUsingJourney(journey.id, schedules).join(", ") }}. Change these schedules before removing this journey.
                </p>
                <JourneySettingsFields
                    v-if="editingJourneyId === journey.id"
                    v-model:journey="journeys[index]!"
                    class="mt-3"
                    :stationGroups="stationGroups"
                    :journeys="journeys"
                    :scheduleNames="[]"
                    :canRemove="false"
                    @changed="emit('changed')"
                />
            </div>
        </section>
        <section class="space-y-3">
            <h2 class="font-semibold">Recent journeys</h2>
            <p
                v-if="recentJourneys.length === 0"
                class="text-sm text-ink-subtle"
            >
                No recent journeys.
            </p>
            <div
                v-for="journey in recentJourneys"
                :key="journey.id"
                class="flex items-start justify-between gap-2 border-t border-line pt-3"
                data-test="recent-journey"
            >
                <JourneyLabel
                    v-if="hasJourneyEndpoints(journey, stationGroups)"
                    :details="getJourneyLabelDetails(journey, stationGroups)"
                />
                <span v-else>Choose journey stations</span>
                <div class="flex items-center gap-2">
                    <span
                        v-if="isSaved(journey)"
                        class="text-xs text-ink-subtle"
                        >Saved</span
                    >
                    <button
                        v-else
                        class="appButton appButton--secondary text-xs px-0 py-1"
                        type="button"
                        @click="saveRecentJourney(journey)"
                    >
                        Save
                    </button>
                    <button
                        class="appButton appButton--danger text-xs px-0 py-1"
                        type="button"
                        @click="forgetJourney(journey.id)"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </section>
    </section>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {hasSameJourneyFields} from "../../../dto/journeySelection.dto";
import type {Journey} from "../../../dto/journey.dto";
import type {DisplaySchedule} from "../../../dto/displaySchedule.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import {getJourneyLabelDetails} from "../../../journeys/journeyLabels";
import {useJourneySelectionStore} from "../../../store/journeySelection.store";
import JourneyLabel from "../../journeys/JourneyLabel.vue";
import JourneySettingsFields from "./JourneySettingsFields.vue";
import {
    getScheduleNamesUsingJourney,
    hasJourneyEndpoints,
} from "../schedules/scheduleSettings";

const props = defineProps<{
    stationGroups: StationGroup[];
    schedules: DisplaySchedule[];
}>();
const journeys = defineModel<Journey[]>("journeys", {required: true});
const recentJourneyIds = defineModel<string[]>("recentJourneyIds", {
    required: true,
});
const emit = defineEmits<{changed: []}>();
const selection = useJourneySelectionStore();
const editingJourneyId = ref<string>();
const recentJourneys = computed(() => {
    const journeysById = new Map<string, Journey>();
    for (const journey of [...selection.ephemeralJourneys, ...journeys.value]) {
        journeysById.set(journey.id, journey);
    }
    return recentJourneyIds.value.flatMap((id) => {
        const journey = journeysById.get(id);
        return journey ? [journey] : [];
    });
});

function isSaved(journey: Journey): boolean {
    return journeys.value.some(
        (saved) =>
            saved.id === journey.id || hasSameJourneyFields(saved, journey)
    );
}

function saveRecentJourney(journey: Journey): void {
    if (isSaved(journey)) return;
    journeys.value.push(JSON.parse(JSON.stringify(journey)));
    emit("changed");
}

function forgetJourney(journeyId: string): void {
    recentJourneyIds.value = recentJourneyIds.value.filter(
        (id) => id !== journeyId
    );
    emit("changed");
}

function removeJourney(journeyId: string): void {
    if (getScheduleNamesUsingJourney(journeyId, props.schedules).length > 0)
        return;
    journeys.value = journeys.value.filter(
        (journey) => journey.id !== journeyId
    );
    forgetJourney(journeyId);
}
</script>
