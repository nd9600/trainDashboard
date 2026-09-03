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
    currentEphemeralJourney: EphemeralJourney | undefined;
    activeJourney: ActiveJourney;
}

export const useJourneySelectionStore = defineStore("journey-selection", {
    state: (): JourneySelectionState => ({
        isInitialised: false,
        recentJourneyIds: [],
        ephemeralJourneys: [],
        currentEphemeralJourney: undefined,
        activeJourney: {type: "predicted"},
    }),

    getters: {
        currentJourneyPrediction(): JourneyPrediction {
            const config = useDashboardConfigStore().config;
            return getJourneyPrediction(
                config.schedules,
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
                [
                    ...state.ephemeralJourneys,
                    ...(state.currentEphemeralJourney
                        ? [state.currentEphemeralJourney]
                        : []),
                    ...savedJourneys,
                ].map((journey) => [journey.id, journey])
            );
        },

        activeJourneyId(state): string | undefined {
            if (state.activeJourney.type === "predicted") {
                return this.predictedJourneyId;
            }

            return state.activeJourney.type === "saved"
                ? state.activeJourney.id
                : state.currentEphemeralJourney?.id;
        },

        activeJourneyDetails(): Journey | undefined {
            return this.activeJourneyId
                ? this.journeysById.get(this.activeJourneyId)
                : undefined;
        },

        journeyChoices(state): JourneyChoices[] {
            const predictedJourney = this.predictedJourneyId
                ? this.journeysById.get(this.predictedJourneyId)
                : undefined;
            const recentChoiceJourneyIds = state.recentJourneyIds.filter(
                (journeyId) => journeyId !== this.predictedJourneyId
            );
            const recentJourneys = getJourneysByIds(
                recentChoiceJourneyIds,
                this.journeysById
            ).slice(0, 3);
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
            this.isInitialised = true;
        },

        selectJourney(journeyId: string): boolean {
            if (!this.isInitialised) {
                return false;
            }

            if (!this.journeysById.has(journeyId)) {
                return false;
            }

            if (journeyId === this.predictedJourneyId) {
                this.activeJourney = {type: "predicted"};
                this.currentEphemeralJourney = undefined;
                return true;
            }

            if (this.savedJourneyIds.has(journeyId)) {
                this.activeJourney = {type: "saved", id: journeyId};
                this.currentEphemeralJourney = undefined;
            } else {
                const ephemeralJourney = this.ephemeralJourneys.find(
                    (journey) => journey.id === journeyId
                );

                if (!ephemeralJourney) {
                    return false;
                }

                this.activeJourney = {type: "ephemeral"};
                this.currentEphemeralJourney = ephemeralJourney;
            }

            this.recentJourneyIds = [
                journeyId,
                ...this.recentJourneyIds.filter(
                    (recentJourneyId) => recentJourneyId !== journeyId
                ),
            ].slice(0, 50);
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
            return this.selectJourney(journey.id);
        },

        saveActiveJourney(): boolean {
            if (
                !this.isInitialised ||
                this.activeJourney.type !== "ephemeral" ||
                !this.currentEphemeralJourney
            ) {
                return false;
            }

            const ephemeralJourneyId = this.currentEphemeralJourney.id;

            const savedJourney = useDashboardConfigStore().saveJourney(
                this.currentEphemeralJourney
            );

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
            this.recentJourneyIds = replaceEphemeralJourneyId(
                this.recentJourneyIds
            );
            this.ephemeralJourneys = this.ephemeralJourneys.filter(
                (candidate) => candidate.id !== ephemeralJourneyId
            );
            this.currentEphemeralJourney = undefined;
            this.activeJourney = {type: "saved", id: savedJourney.id};
            this.saveMemory();
            return true;
        },

        editActiveJourney(fields: JourneyFields): boolean {
            const activeJourneyDetails = this.activeJourneyDetails;

            if (
                !this.isInitialised ||
                this.activeJourney.type === "predicted" ||
                !activeJourneyDetails ||
                useDashboardConfigStore().config.schedules.some(
                    (schedule) => schedule.journeyId === activeJourneyDetails.id
                )
            ) {
                return false;
            }

            if (this.activeJourney.type === "ephemeral") {
                const parsedJourney = createEphemeralJourney(fields);

                if (!parsedJourney || !this.currentEphemeralJourney) {
                    return false;
                }

                const updatedJourney: EphemeralJourney = {
                    ...parsedJourney,
                    id: this.currentEphemeralJourney.id,
                };
                this.ephemeralJourneys = this.ephemeralJourneys.map(
                    (journey) =>
                        journey.id === updatedJourney.id
                            ? updatedJourney
                            : journey
                );
                this.currentEphemeralJourney = updatedJourney;
                this.saveMemory();
                return true;
            }

            return useDashboardConfigStore().updateJourney({
                id: activeJourneyDetails.id,
                ...fields,
            });
        },

        removeRecentJourney(journeyId: string): boolean {
            if (
                !this.isInitialised ||
                !this.recentJourneyIds.includes(journeyId)
            ) {
                return false;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );
            this.saveMemory();
            return true;
        },

        removeSavedJourney(journeyId: string): boolean {
            if (
                !this.isInitialised ||
                !this.savedJourneyIds.has(journeyId) ||
                !useDashboardConfigStore().removeJourney(journeyId)
            ) {
                return false;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );

            if (this.activeJourneyId === journeyId) {
                this.activeJourney = {type: "predicted"};
                this.currentEphemeralJourney = undefined;
            }

            this.saveMemory();
            return true;
        },

        clearActiveJourney(): boolean {
            if (
                !this.isInitialised ||
                this.activeJourney.type === "predicted"
            ) {
                return false;
            }

            this.activeJourney = {type: "predicted"};
            this.currentEphemeralJourney = undefined;
            return true;
        },

        saveMemory(): void {
            const retainedJourneyIds = new Set(this.recentJourneyIds);
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

function getJourneysByIds(
    journeyIds: string[],
    journeysById: Map<string, Journey>
): Journey[] {
    const journeys: Journey[] = [];

    for (const journeyId of journeyIds) {
        const journey = journeysById.get(journeyId);

        if (journey) {
            journeys.push(journey);
        }
    }

    return journeys;
}
