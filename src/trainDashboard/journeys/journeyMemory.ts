import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    journeyMemorySchema,
    type ActiveJourney,
    type JourneyMemory,
} from "../dto/journeySelection.dto";
import {getRetainedEphemeralJourneys} from "./journeySelection";

const memoryStorage = useLocalStorageTyped(
    "train-dashboard-journey-memory-v2",
    journeyMemorySchema,
    {recentJourneyIds: [], ephemeralJourneys: []}
);

export interface JourneySelectionState extends JourneyMemory {
    predictionRecentJourneyIds: string[];
    activeJourney: ActiveJourney;
    previousActiveJourneys: ActiveJourney[];
}

export function loadJourneySelectionState(): JourneySelectionState {
    const savedMemory = memoryStorage.loadFromLocalStorage();

    return {
        recentJourneyIds: savedMemory.recentJourneyIds,
        ephemeralJourneys: savedMemory.ephemeralJourneys,
        predictionRecentJourneyIds: [...savedMemory.recentJourneyIds],
        activeJourney: {type: "predicted"},
        previousActiveJourneys: [],
    };
}

export function saveJourneySelectionMemory(
    state: JourneySelectionState
): JourneyMemory["ephemeralJourneys"] {
    const ephemeralJourneys = getRetainedEphemeralJourneys(
        state.ephemeralJourneys,
        state.predictionRecentJourneyIds,
        state.recentJourneyIds,
        state.activeJourney,
        state.previousActiveJourneys
    );
    memoryStorage.saveToLocalStorage({
        recentJourneyIds: state.recentJourneyIds,
        ephemeralJourneys,
    });

    return ephemeralJourneys;
}
