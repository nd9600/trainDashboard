import {defineStore} from "pinia";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {DisplaySchedule} from "../dto/displaySchedule.dto";
import type {Journey, JourneyFields} from "../dto/journey.dto";
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
            const recentJourneys = recentChoiceJourneyIds
                .map((journeyId) => this.journeysById.get(journeyId))
                .filter((journey) => journey !== undefined)
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
            this.isInitialised = true;
        },

        selectJourney(journeyId: string): void {
            if (!this.isInitialised) {
                return;
            }

            if (!this.journeysById.has(journeyId)) {
                return;
            }

            if (journeyId === this.predictedJourneyId) {
                this.activeJourney = {type: "predicted"};
                this.currentEphemeralJourney = undefined;
                return;
            }

            if (
                useDashboardConfigStore().config.journeys.some(
                    (journey) => journey.id === journeyId
                )
            ) {
                this.activeJourney = {type: "saved", id: journeyId};
                this.currentEphemeralJourney = undefined;
            } else {
                const ephemeralJourney = this.ephemeralJourneys.find(
                    (journey) => journey.id === journeyId
                );

                if (!ephemeralJourney) {
                    return;
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
        },

        selectEphemeralJourney(fields: JourneyFields): void {
            if (!this.isInitialised) {
                return;
            }

            const parsedJourney = createEphemeralJourney(fields);

            if (!parsedJourney) {
                return;
            }

            const existingJourney = [...this.journeysById.values()].find(
                (journey) => hasSameJourneyFields(journey, parsedJourney)
            );

            if (existingJourney) {
                this.selectJourney(existingJourney.id);
                return;
            }

            const journey = createEphemeralJourney(
                fields,
                this.journeysById.keys()
            )!;
            this.ephemeralJourneys = [...this.ephemeralJourneys, journey];
            this.selectJourney(journey.id);
        },

        saveActiveJourney(): void {
            if (
                !this.isInitialised ||
                this.activeJourney.type !== "ephemeral" ||
                !this.currentEphemeralJourney
            ) {
                return;
            }

            const ephemeralJourneyId = this.currentEphemeralJourney.id;

            const savedJourney = useDashboardConfigStore().saveJourney(
                this.currentEphemeralJourney
            );

            this.recentJourneyIds = [
                ...new Set(
                    this.recentJourneyIds.map((journeyId) =>
                        journeyId === ephemeralJourneyId
                            ? savedJourney.id
                            : journeyId
                    )
                ),
            ];
            this.ephemeralJourneys = this.ephemeralJourneys.filter(
                (candidate) => candidate.id !== ephemeralJourneyId
            );
            this.currentEphemeralJourney = undefined;
            this.activeJourney = {type: "saved", id: savedJourney.id};
            this.saveMemory();
        },

        editActiveJourney(fields: JourneyFields): void {
            const activeJourneyDetails = this.activeJourneyDetails;

            if (
                !this.isInitialised ||
                this.activeJourney.type === "predicted" ||
                !activeJourneyDetails
            ) {
                return;
            }

            if (this.activeJourney.type === "ephemeral") {
                const parsedJourney = createEphemeralJourney(fields);

                if (!parsedJourney || !this.currentEphemeralJourney) {
                    return;
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
                return;
            }

            useDashboardConfigStore().updateJourney({
                id: activeJourneyDetails.id,
                ...fields,
            });
        },

        removeRecentJourney(journeyId: string): void {
            if (
                !this.isInitialised ||
                !this.recentJourneyIds.includes(journeyId)
            ) {
                return;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );
            this.saveMemory();
        },

        removeSavedJourney(journeyId: string): void {
            if (
                !this.isInitialised ||
                !useDashboardConfigStore().removeJourney(journeyId)
            ) {
                return;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );

            if (this.activeJourneyId === journeyId) {
                this.activeJourney = {type: "predicted"};
                this.currentEphemeralJourney = undefined;
            }

            this.saveMemory();
        },

        clearActiveJourney(): void {
            if (
                !this.isInitialised ||
                this.activeJourney.type === "predicted"
            ) {
                return;
            }

            this.activeJourney = {type: "predicted"};
            this.currentEphemeralJourney = undefined;
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
