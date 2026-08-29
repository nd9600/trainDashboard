import {defineStore} from "pinia";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {
    DisplaySchedule,
    Journey,
    JourneyFields,
} from "../dto/dashboardConfig.dto";
import {
    createEphemeralJourney,
    JourneyMemorySchema,
    type ActiveJourney,
    type EphemeralJourney,
    type JourneyChoiceGroup,
} from "../dto/journeySelection.dto";
import {
    getJourneyPrediction,
    type JourneyPrediction,
} from "../journeys/journeyPrediction";
import {useDashboardClockStore} from "./dashboardClock.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";

const memoryStorage = useLocalStorageTyped(
    "train-dashboard-journey-memory-v2",
    JourneyMemorySchema,
    {recentJourneyIds: [], ephemeralJourneys: []}
);

interface JourneySelectionState {
    isInitialised: boolean;
    recentJourneyIds: string[];
    ephemeralJourneys: EphemeralJourney[];
    predictionRecentJourneyIds: string[];
    activeJourney: ActiveJourney;
    previousActiveJourneys: ActiveJourney[];
}

export const useJourneySelectionStore = defineStore("journey-selection", {
    state: (): JourneySelectionState => ({
        isInitialised: false,
        recentJourneyIds: [],
        ephemeralJourneys: [],
        predictionRecentJourneyIds: [],
        activeJourney: {type: "predicted"},
        previousActiveJourneys: [],
    }),

    getters: {
        activeSchedule(state): DisplaySchedule | undefined {
            return getPrediction(state).activeSchedule;
        },

        predictedJourneyId(state): string | undefined {
            return getPrediction(state).predictedJourneyId;
        },

        activeJourneyId(state): string | undefined {
            return state.activeJourney.type === "predicted"
                ? this.predictedJourneyId
                : state.activeJourney.id;
        },

        activeJourneyDetails(state): Journey | undefined {
            return this.activeJourneyId
                ? getJourneysById(state).get(this.activeJourneyId)
                : undefined;
        },

        activeJourneyIsEphemeral(): boolean {
            return (
                this.activeJourneyId !== undefined &&
                !getSavedJourneyIds().has(this.activeJourneyId)
            );
        },

        journeyChoices(state): JourneyChoiceGroup[] {
            const journeysById = getJourneysById(state);
            const predictedJourney = this.predictedJourneyId
                ? journeysById.get(this.predictedJourneyId)
                : undefined;
            const recentJourneys = state.recentJourneyIds
                .filter((journeyId) => journeyId !== this.predictedJourneyId)
                .flatMap((journeyId) => {
                    const journey = journeysById.get(journeyId);
                    return journey ? [journey] : [];
                })
                .slice(0, 3);
            const recentJourneyIds = new Set(
                recentJourneys.map((journey) => journey.id)
            );
            const otherSavedJourneys = getSavedJourneys().filter(
                (journey) =>
                    journey.id !== this.predictedJourneyId &&
                    !recentJourneyIds.has(journey.id)
            );
            const groups: JourneyChoiceGroup[] = [
                {
                    name: "Predicted",
                    journeys: predictedJourney ? [predictedJourney] : [],
                },
                {name: "Recent", journeys: recentJourneys},
                {name: "Saved", journeys: otherSavedJourneys},
            ];

            return groups.filter((group) => group.journeys.length > 0);
        },
    },

    actions: {
        initialise(): void {
            if (this.isInitialised) {
                return;
            }

            const savedMemory = memoryStorage.loadFromLocalStorage();
            this.recentJourneyIds = savedMemory.recentJourneyIds;
            this.ephemeralJourneys = savedMemory.ephemeralJourneys;
            this.predictionRecentJourneyIds = [...savedMemory.recentJourneyIds];
            this.isInitialised = true;
        },

        selectJourney(journeyId: string): boolean {
            if (!this.isInitialised) {
                return false;
            }

            const journeysById = getJourneysById(this);

            if (!journeysById.has(journeyId)) {
                return false;
            }

            const savedJourneyIds = getSavedJourneyIds();
            const selection: ActiveJourney =
                journeyId === this.predictedJourneyId
                    ? {type: "predicted"}
                    : savedJourneyIds.has(journeyId)
                      ? {type: "saved", id: journeyId}
                      : {type: "ephemeral", id: journeyId};

            setActiveJourney(
                this,
                selection,
                this.predictedJourneyId,
                savedJourneyIds
            );
            saveMemory(this);
            return true;
        },

        selectEphemeralJourney(fields: JourneyFields): boolean {
            if (!this.isInitialised) {
                return false;
            }

            const parsedJourney = createEphemeralJourney(fields);

            if (!parsedJourney) {
                return false;
            }

            const journeysById = getJourneysById(this);
            const existingJourney = [...journeysById.values()].find((journey) =>
                hasSameJourneyFields(journey, parsedJourney)
            );

            if (existingJourney) {
                return this.selectJourney(existingJourney.id);
            }

            const predictedJourneyId = this.predictedJourneyId;
            const journey = createEphemeralJourney(
                fields,
                journeysById.keys()
            )!;
            this.ephemeralJourneys = [...this.ephemeralJourneys, journey];
            setActiveJourney(
                this,
                {type: "ephemeral", id: journey.id},
                predictedJourneyId,
                getSavedJourneyIds()
            );
            saveMemory(this);
            return true;
        },

        saveActiveJourney(): boolean {
            if (
                !this.isInitialised ||
                !this.activeJourneyIsEphemeral ||
                !this.activeJourneyId
            ) {
                return false;
            }

            const ephemeralJourneyId = this.activeJourneyId;
            const journey = getJourneysById(this).get(ephemeralJourneyId);

            if (!journey) {
                return false;
            }

            const savedJourney = useDashboardConfigStore().saveJourney(journey);

            if (!savedJourney) {
                return false;
            }

            this.predictionRecentJourneyIds = replaceJourneyId(
                this.predictionRecentJourneyIds,
                ephemeralJourneyId,
                savedJourney.id
            );
            this.recentJourneyIds = replaceJourneyId(
                this.recentJourneyIds,
                ephemeralJourneyId,
                savedJourney.id
            );
            this.ephemeralJourneys = this.ephemeralJourneys.filter(
                (candidate) => candidate.id !== ephemeralJourneyId
            );
            this.previousActiveJourneys = [];
            this.activeJourney =
                this.activeJourney.type === "predicted"
                    ? {type: "predicted"}
                    : {type: "saved", id: savedJourney.id};
            saveMemory(this);
            return true;
        },

        clearActiveJourney(): boolean {
            if (
                !this.isInitialised ||
                this.activeJourney.type !== "ephemeral"
            ) {
                return false;
            }

            const previousJourney = this.previousActiveJourneys.pop() ?? {
                type: "predicted" as const,
            };
            this.activeJourney = normaliseActiveJourney(
                previousJourney,
                this.predictedJourneyId,
                getJourneysById(this)
            );
            saveMemory(this);
            return true;
        },
    },
});

function getPrediction(state: JourneySelectionState): JourneyPrediction {
    const config = useDashboardConfigStore().config;
    return getJourneyPrediction(
        config.schedules,
        [...state.ephemeralJourneys, ...config.journeys],
        state.predictionRecentJourneyIds,
        useDashboardClockStore().currentClock
    );
}

function getSavedJourneys(): Journey[] {
    return useDashboardConfigStore().config.journeys;
}

function getSavedJourneyIds(): Set<string> {
    return new Set(getSavedJourneys().map((journey) => journey.id));
}

function getJourneysById(state: JourneySelectionState): Map<string, Journey> {
    return new Map(
        [...state.ephemeralJourneys, ...getSavedJourneys()].map((journey) => [
            journey.id,
            journey,
        ])
    );
}

function setActiveJourney(
    state: JourneySelectionState,
    selection: ActiveJourney,
    predictedJourneyId: string | undefined,
    savedJourneyIds: Set<string>
): void {
    const activeJourneyId =
        state.activeJourney.type === "predicted"
            ? predictedJourneyId
            : state.activeJourney.id;

    if (selection.type === "predicted" || selection.type === "saved") {
        state.previousActiveJourneys = [];
    } else if (selection.id !== activeJourneyId) {
        state.previousActiveJourneys.push(
            getRestorableActiveJourney(
                state.activeJourney,
                activeJourneyId,
                savedJourneyIds
            )
        );
    }

    state.activeJourney = selection;
    const selectedJourneyId =
        selection.type === "predicted" ? predictedJourneyId : selection.id;

    if (selectedJourneyId) {
        state.recentJourneyIds = [
            selectedJourneyId,
            ...state.recentJourneyIds.filter(
                (journeyId) => journeyId !== selectedJourneyId
            ),
        ].slice(0, 50);
    }
}

function getRestorableActiveJourney(
    activeJourney: ActiveJourney,
    activeJourneyId: string | undefined,
    savedJourneyIds: Set<string>
): ActiveJourney {
    if (activeJourney.type !== "predicted") {
        return {...activeJourney};
    }

    if (!activeJourneyId) {
        return {type: "predicted"};
    }

    return savedJourneyIds.has(activeJourneyId)
        ? {type: "saved", id: activeJourneyId}
        : {type: "ephemeral", id: activeJourneyId};
}

function normaliseActiveJourney(
    activeJourney: ActiveJourney,
    predictedJourneyId: string | undefined,
    journeysById: Map<string, Journey>
): ActiveJourney {
    if (activeJourney.type === "predicted") {
        return activeJourney;
    }

    if (!journeysById.has(activeJourney.id)) {
        return {type: "predicted"};
    }

    return activeJourney.id === predictedJourneyId
        ? {type: "predicted"}
        : activeJourney;
}

function hasSameJourneyFields(first: Journey, second: Journey): boolean {
    return (
        hasSameLocation(first.origin, second.origin) &&
        hasSameLocation(first.destination, second.destination) &&
        first.viaCrs === second.viaCrs
    );
}

function hasSameLocation(
    first: Journey["origin"],
    second: Journey["origin"]
): boolean {
    return (
        first.type === second.type &&
        first.groupId === second.groupId &&
        (first.type === "group" ||
            (second.type === "station" && first.crs === second.crs))
    );
}

function replaceJourneyId(
    journeyIds: string[],
    oldJourneyId: string,
    newJourneyId: string
): string[] {
    return [
        ...new Set(
            journeyIds.map((journeyId) =>
                journeyId === oldJourneyId ? newJourneyId : journeyId
            )
        ),
    ];
}

function saveMemory(state: JourneySelectionState): void {
    const retainedJourneyIds = new Set([
        ...state.predictionRecentJourneyIds,
        ...state.recentJourneyIds,
        ...(state.activeJourney.type === "ephemeral"
            ? [state.activeJourney.id]
            : []),
        ...state.previousActiveJourneys.flatMap((selection) =>
            selection.type === "ephemeral" ? [selection.id] : []
        ),
    ]);
    state.ephemeralJourneys = state.ephemeralJourneys.filter((journey) =>
        retainedJourneyIds.has(journey.id)
    );
    memoryStorage.saveToLocalStorage({
        recentJourneyIds: state.recentJourneyIds,
        ephemeralJourneys: state.ephemeralJourneys,
    });
}
