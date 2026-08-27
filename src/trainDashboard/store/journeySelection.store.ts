import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    journeyHistorySchema,
    type JourneyHistoryEntry,
} from "../dto/journeyHistory.dto";

const historyStorage = useLocalStorageTyped(
    "train-dashboard-journey-history-v1",
    journeyHistorySchema,
    []
);

export const useJourneySelectionStore = defineStore("journey-selection", () => {
    const temporaryJourneyId = ref<string>();
    const recentJourneyHistory = ref<JourneyHistoryEntry[]>(
        historyStorage.loadFromLocalStorage()
    );

    function selectSavedJourney(
        journeyId: string,
        predictedJourneyId: string | undefined,
        selectedAt = new Date()
    ): void {
        temporaryJourneyId.value =
            journeyId === predictedJourneyId ? undefined : journeyId;
        recentJourneyHistory.value = [
            {journeyId, selectedAt: selectedAt.toISOString()},
            ...recentJourneyHistory.value,
        ].slice(0, 50);
        historyStorage.saveToLocalStorage(recentJourneyHistory.value);
    }

    return {
        recentJourneyHistory,
        temporaryJourneyId,
        selectSavedJourney,
    };
});
