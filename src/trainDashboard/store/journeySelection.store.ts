import {journeyReferencesExistingGroups, journeysAreTheSame} from "../journeys/journeyIdentity";
import {useJourneyLocation} from "@/composables/useJourneyLocation";
import {getJourneyChoices} from "../journeys/journeyChoices";
import type {Coordinates} from "../dto/coordinates.dto";
import {defineStore} from "pinia";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {Journey, JourneyFields} from "../dto/journey.dto";
import {
    createEphemeralJourney,
    JourneyMemorySchema,
    type ActiveJourneySelection,
    type EphemeralJourney,
    type JourneyChoices,
} from "../dto/journeySelection.dto";
import {getJourneyPrediction, type JourneyPrediction} from "../journeys/journeyPrediction";
import {useDashboardClockStore} from "./dashboardClock.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
const recentJourneyStorage = useLocalStorageTyped(
    "train-dashboard-journey-memory-v2",
    JourneyMemorySchema,
    {recentJourneyIds: [], ephemeralJourneys: []}
);

interface JourneySelectionState {
    isInitialised: boolean;
    recentJourneyIds: string[];
    recentEphemeralJourneys: EphemeralJourney[];
    activeSelection: ActiveJourneySelection;
    currentCoordinates: Coordinates | null;
}

export const useJourneySelectionStore = defineStore("journey-selection", {
    state: (): JourneySelectionState => ({
        isInitialised: false,
        recentJourneyIds: [],
        recentEphemeralJourneys: [],
        activeSelection: {type: "predicted"},
        currentCoordinates: null,
    }),

    getters: {
        currentEphemeralJourney(state): EphemeralJourney | undefined {
            return state.activeSelection.type === "ephemeral"
                && journeyReferencesExistingGroups(
                    state.activeSelection.journey,
                    useDashboardConfigStore().config.stationGroups
                )
                ? state.activeSelection.journey
                : undefined;
        },
        currentJourneyPrediction(): JourneyPrediction {
            const config = useDashboardConfigStore().config;
            return getJourneyPrediction(
                config,
                useDashboardClockStore().currentClock,
                config.shouldUseLocation ? this.currentCoordinates : null
            );
        },

        predictedJourneyId(): string | undefined {
            return this.currentJourneyPrediction.predictedJourneyId;
        },

        journeysById(state): Map<string, Journey> {
            const config = useDashboardConfigStore().config;
            return new Map(
                [
                    ...state.recentEphemeralJourneys,
                    ...(this.currentEphemeralJourney ? [this.currentEphemeralJourney] : []),
                    ...config.journeys,
                ]
                    .filter((journey) =>
                        journeyReferencesExistingGroups(journey, config.stationGroups)
                    )
                    .map((journey) => [journey.id, journey])
            );
        },

        activeJourneyId(state): string | undefined {
            if (state.activeSelection.type === "predicted") {
                return this.predictedJourneyId;
            }

            return state.activeSelection.type === "saved"
                ? state.activeSelection.id
                : this.currentEphemeralJourney?.id;
        },

        activeJourney(): Journey | undefined {
            return this.activeJourneyId
                ? this.journeysById.get(this.activeJourneyId)
                : undefined;
        },

        journeyChoices(state): JourneyChoices[] {
            return getJourneyChoices(
                this.journeysById,
                this.currentJourneyPrediction,
                state.recentJourneyIds,
                useDashboardConfigStore().config.journeys
            );
        },
    },

    actions: {
        initialise(): void {
            if (this.isInitialised) {
                return;
            }

            const savedMemory = recentJourneyStorage.loadFromLocalStorage();
            this.recentJourneyIds = savedMemory.recentJourneyIds;
            this.recentEphemeralJourneys = savedMemory.ephemeralJourneys;
            this.isInitialised = true;
            const dashboardConfigStore = useDashboardConfigStore();

            useJourneyLocation(
                () => dashboardConfigStore.config.shouldUseLocation,
                (coordinates) => {
                    this.currentCoordinates = coordinates;
                }
            );
        },

        selectJourney(journeyId: string): void {
            if (!this.isInitialised || !this.journeysById.has(journeyId)) {
                return
            }

            if (journeyId === this.predictedJourneyId) {
                this.resetActiveJourneyToPredicted();
                return;
            }
            const dashboardConfigStore = useDashboardConfigStore();

            const isSavedJourney = dashboardConfigStore.config.journeys
                .some((journey) => journey.id === journeyId);
            const ephemeralJourney = this.recentEphemeralJourneys.find((journey) => journey.id === journeyId)
                ?? this.currentEphemeralJourney;

            this.activeSelection = isSavedJourney
                ? {type: "saved", id: journeyId}
                : {type: "ephemeral", journey: ephemeralJourney!};
            this.recentJourneyIds = [
                journeyId,
                ...this.recentJourneyIds.filter((id) => id !== journeyId),
            ].slice(0, 50);

            this.persistRecentJourneys();
        },

        addEphemeralJourney(fields: JourneyFields): void {
            if (!this.isInitialised) {
                return;
            }

            const parsedJourney = createEphemeralJourney(fields, this.journeysById.keys());
            if (!parsedJourney) {
                return;
            }

            const existingJourney = [...this.journeysById.values()].find((journey) =>
                journeysAreTheSame(journey, parsedJourney)
            );

            const newEphemeralJourneyAlreadyExists = existingJourney !== undefined;
            if (newEphemeralJourneyAlreadyExists) {
                this.selectJourney(existingJourney.id);
                return;
            }

            this.recentEphemeralJourneys.push(parsedJourney);
            this.selectJourney(parsedJourney.id);
        },

        saveEphemeralJourney(): void {
            if (
                !this.isInitialised
                || this.activeSelection.type !== "ephemeral"
                || !this.currentEphemeralJourney
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
                        journeyId === ephemeralJourneyId ? savedJourney.id : journeyId
                    )
                ),
            ];
            this.recentEphemeralJourneys = this.recentEphemeralJourneys.filter(
                (candidate) => candidate.id !== ephemeralJourneyId
            );
            this.activeSelection = {type: "saved", id: savedJourney.id};
            this.persistRecentJourneys();
        },

        editSavedOrEphemeralJourney(fields: JourneyFields): void {
            if (
                !this.isInitialised
                || this.activeSelection.type === "predicted"
                || !this.activeJourney
            ) {
                return;
            }

            if (this.activeSelection.type === "ephemeral") {
                const parsedJourney = createEphemeralJourney(fields);

                if (!parsedJourney || !this.currentEphemeralJourney) {
                    return;
                }

                const updatedJourney: EphemeralJourney = {
                    ...parsedJourney,
                    id: this.currentEphemeralJourney.id,
                };
                this.recentEphemeralJourneys = this.recentEphemeralJourneys.map((journey) =>
                    journey.id === updatedJourney.id ? updatedJourney : journey
                );
                this.activeSelection = {type: "ephemeral", journey: updatedJourney};
                this.persistRecentJourneys();
                return;
            } else {
                useDashboardConfigStore().updateJourney({
                    id: this.activeJourney.id,
                    ...fields,
                });
            }
        },

        removeRecentJourney(journeyId: string): void {
            if (!this.isInitialised || !this.recentJourneyIds.includes(journeyId)) {
                return;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );
            this.persistRecentJourneys();
        },

        removeSavedJourney(journeyId: string): void {
            if (!this.isInitialised || !useDashboardConfigStore().removeJourney(journeyId)) {
                return;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );

            if (this.activeJourneyId === journeyId) {
                this.resetActiveJourneyToPredicted();
            }

            this.persistRecentJourneys();
        },

        resetActiveJourneyToPredicted(): void {
            if (!this.isInitialised) {
                return
            }
            this.activeSelection = {type: "predicted"};
        },

        persistRecentJourneys(): void {
            const retainedJourneyIds = new Set(this.recentJourneyIds);

            this.recentEphemeralJourneys = this.recentEphemeralJourneys.filter((journey) =>
                retainedJourneyIds.has(journey.id)
            );

            recentJourneyStorage.saveToLocalStorage({
                recentJourneyIds: this.recentJourneyIds,
                ephemeralJourneys: this.recentEphemeralJourneys,
            });
        },
    },
});
