import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    journeyHistorySchema,
    type JourneyHistoryEntry,
} from "../dto/journeyHistory.dto";
import {
    isEphemeralJourney,
    type EphemeralJourney,
    type JourneySelection,
} from "../dto/journeySelection.dto";
import type {Journey} from "../dto/dashboardConfig.dto";

const historyStorage = useLocalStorageTyped(
    "train-dashboard-journey-history-v1",
    journeyHistorySchema,
    []
);

export const useJourneySelectionStore = defineStore("journey-selection", () => {
    const temporaryJourney = ref<JourneySelection>();
    const ephemeralJourneyBackStack: Array<JourneySelection | undefined> = [];
    const recentJourneyHistory = ref<JourneyHistoryEntry[]>(
        historyStorage.loadFromLocalStorage()
    );

    function selectJourney(
        journey: JourneySelection,
        predictedJourneyId: string | undefined,
        activeJourneyBeforeSelection: JourneySelection | undefined =
            temporaryJourney.value,
        selectedAt = new Date()
    ): void {
        if (journey.id === predictedJourneyId) {
            ephemeralJourneyBackStack.length = 0;
        } else if (
            isEphemeralJourney(journey) &&
            journey.id !== temporaryJourney.value?.id
        ) {
            ephemeralJourneyBackStack.push(activeJourneyBeforeSelection);
        } else if (!isEphemeralJourney(journey)) {
            ephemeralJourneyBackStack.length = 0;
        }

        temporaryJourney.value =
            journey.id === predictedJourneyId ? undefined : journey;
        recentJourneyHistory.value = [
            getHistoryEntry(journey, selectedAt),
            ...recentJourneyHistory.value,
        ].slice(0, 50);
        historyStorage.saveToLocalStorage(recentJourneyHistory.value);
    }

    function clearEphemeralJourney(
        predictedJourneyId: string | undefined
    ): boolean {
        if (!isEphemeralJourney(temporaryJourney.value)) {
            return false;
        }

        const previousJourney = ephemeralJourneyBackStack.pop();
        temporaryJourney.value =
            previousJourney?.id === predictedJourneyId
                ? undefined
                : previousJourney;
        return true;
    }

    function markEphemeralJourneySaved(
        ephemeralJourney: EphemeralJourney,
        savedJourney: Journey
    ): void {
        if (temporaryJourney.value?.id === ephemeralJourney.id) {
            temporaryJourney.value = savedJourney;
        }
        ephemeralJourneyBackStack.length = 0;

        recentJourneyHistory.value = recentJourneyHistory.value.map((entry) =>
            entry.type === "ephemeral" &&
            entry.journey.id === ephemeralJourney.id
                ? {
                      type: "saved" as const,
                      journeyId: savedJourney.id,
                      selectedAt: entry.selectedAt,
                  }
                : entry
        );
        historyStorage.saveToLocalStorage(recentJourneyHistory.value);
    }

    return {
        recentJourneyHistory,
        temporaryJourney,
        selectJourney,
        clearEphemeralJourney,
        markEphemeralJourneySaved,
    };
});

function getHistoryEntry(
    journey: JourneySelection,
    selectedAt: Date
): JourneyHistoryEntry {
    return isEphemeralJourney(journey)
        ? {
              type: "ephemeral",
              journey,
              selectedAt: selectedAt.toISOString(),
          }
        : {
              type: "saved",
              journeyId: journey.id,
              selectedAt: selectedAt.toISOString(),
          };
}
