import {defineStore} from "pinia";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {
    DisplaySchedule,
    Journey,
    JourneyFields,
} from "../dto/dashboardConfig.dto";
import {
    createEphemeralJourney,
    hasSameJourneyFields,
    JourneyMemorySchema,
    type ActiveJourney,
    type EphemeralJourney,
    type JourneyChoices,
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
        currentJourneyPrediction(state): JourneyPrediction {
            const config = useDashboardConfigStore().config;
            return getJourneyPrediction(
                config.schedules,
                [...state.ephemeralJourneys, ...config.journeys],
                state.predictionRecentJourneyIds,
                useDashboardClockStore().currentClock
            );
        },

        activeSchedule(): DisplaySchedule | undefined {
            return this.currentJourneyPrediction.activeSchedule;
        },

        predictedJourneyId(): string | undefined {
            return this.currentJourneyPrediction.predictedJourneyId;
        },

        savedJourneyIds(): Set<string> {
            return new Set(
                useDashboardConfigStore().config.journeys.map(
                    (journey) => journey.id
                )
            );
        },

        journeysById(state): Map<string, Journey> {
            const savedJourneys = useDashboardConfigStore().config.journeys;
            return new Map(
                [...state.ephemeralJourneys, ...savedJourneys].map(
                    (journey) => [journey.id, journey]
                )
            );
        },

        activeJourneyId(state): string | undefined {
            return state.activeJourney.type === "predicted"
                ? this.predictedJourneyId
                : state.activeJourney.id;
        },

        activeJourneyDetails(): Journey | undefined {
            return this.activeJourneyId
                ? this.journeysById.get(this.activeJourneyId)
                : undefined;
        },

        activeJourneyIsEphemeral(): boolean {
            return (
                this.activeJourneyId !== undefined &&
                !this.savedJourneyIds.has(this.activeJourneyId)
            );
        },

        journeyChoices(state): JourneyChoices[] {
            const predictedJourney = this.predictedJourneyId
                ? this.journeysById.get(this.predictedJourneyId)
                : undefined;
            const recentJourneys = state.recentJourneyIds
                .filter((journeyId) => journeyId !== this.predictedJourneyId)
                .flatMap((journeyId) => {
                    const journey = this.journeysById.get(journeyId);
                    return journey ? [journey] : [];
                })
                .slice(0, 3);
            const recentJourneyIds = new Set(
                recentJourneys.map((journey) => journey.id)
            );
            const otherSavedJourneys =
                useDashboardConfigStore().config.journeys.filter(
                    (journey) =>
                        journey.id !== this.predictedJourneyId &&
                        !recentJourneyIds.has(journey.id)
                );
            const groups: JourneyChoices[] = [
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

            if (!this.journeysById.has(journeyId)) {
                return false;
            }

            const selection: ActiveJourney =
                journeyId === this.predictedJourneyId
                    ? {type: "predicted"}
                    : this.savedJourneyIds.has(journeyId)
                      ? {type: "saved", id: journeyId}
                      : {type: "ephemeral", id: journeyId};

            this.setActiveJourney(selection);
            this.saveMemory();
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

            const existingJourney = [...this.journeysById.values()].find(
                (journey) => hasSameJourneyFields(journey, parsedJourney)
            );

            if (existingJourney) {
                return this.selectJourney(existingJourney.id);
            }

            const journey = createEphemeralJourney(
                fields,
                this.journeysById.keys()
            )!;
            this.ephemeralJourneys = [...this.ephemeralJourneys, journey];
            this.setActiveJourney({type: "ephemeral", id: journey.id});
            this.saveMemory();
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
            const journey = this.journeysById.get(ephemeralJourneyId);

            if (!journey) {
                return false;
            }

            const savedJourney = useDashboardConfigStore().saveJourney(journey);

            if (!savedJourney) {
                return false;
            }

            const replaceEphemeralJourneyId = (journeyIds: string[]) => [
                ...new Set(
                    journeyIds.map((journeyId) =>
                        journeyId === ephemeralJourneyId
                            ? savedJourney.id
                            : journeyId
                    )
                ),
            ];
            this.predictionRecentJourneyIds = replaceEphemeralJourneyId(
                this.predictionRecentJourneyIds
            );
            this.recentJourneyIds = replaceEphemeralJourneyId(
                this.recentJourneyIds
            );
            this.ephemeralJourneys = this.ephemeralJourneys.filter(
                (candidate) => candidate.id !== ephemeralJourneyId
            );
            this.previousActiveJourneys = [];
            this.activeJourney =
                this.activeJourney.type === "predicted"
                    ? {type: "predicted"}
                    : {type: "saved", id: savedJourney.id};
            this.saveMemory();
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
            this.activeJourney =
                previousJourney.type === "predicted" ||
                !this.journeysById.has(previousJourney.id) ||
                previousJourney.id === this.predictedJourneyId
                    ? {type: "predicted"}
                    : previousJourney;
            this.saveMemory();
            return true;
        },

        setActiveJourney(selection: ActiveJourney): void {
            const predictedJourneyId = this.predictedJourneyId;
            const activeJourneyId =
                this.activeJourney.type === "predicted"
                    ? predictedJourneyId
                    : this.activeJourney.id;

            if (selection.type === "predicted" || selection.type === "saved") {
                this.previousActiveJourneys = [];
            } else if (selection.id !== activeJourneyId) {
                let previousJourney = this.activeJourney;

                if (previousJourney.type === "predicted" && activeJourneyId) {
                    previousJourney = this.savedJourneyIds.has(activeJourneyId)
                        ? {type: "saved", id: activeJourneyId}
                        : {type: "ephemeral", id: activeJourneyId};
                }

                this.previousActiveJourneys.push({...previousJourney});
            }

            this.activeJourney = selection;
            const selectedJourneyId =
                selection.type === "predicted"
                    ? predictedJourneyId
                    : selection.id;

            if (selectedJourneyId) {
                this.recentJourneyIds = [
                    selectedJourneyId,
                    ...this.recentJourneyIds.filter(
                        (journeyId) => journeyId !== selectedJourneyId
                    ),
                ].slice(0, 50);
            }
        },

        saveMemory(): void {
            const retainedJourneyIds = new Set([
                ...this.predictionRecentJourneyIds,
                ...this.recentJourneyIds,
                ...(this.activeJourney.type === "ephemeral"
                    ? [this.activeJourney.id]
                    : []),
                ...this.previousActiveJourneys.flatMap((selection) =>
                    selection.type === "ephemeral" ? [selection.id] : []
                ),
            ]);
            this.ephemeralJourneys = this.ephemeralJourneys.filter((journey) =>
                retainedJourneyIds.has(journey.id)
            );
            memoryStorage.saveToLocalStorage({
                recentJourneyIds: this.recentJourneyIds,
                ephemeralJourneys: this.ephemeralJourneys,
            });
        },
    },
});
