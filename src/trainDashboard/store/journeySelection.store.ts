import {hasJourneyEndpoints, journeysAreTheSame} from "../journeys/journeyIdentity";
import {useJourneyLocation} from "@/composables/useJourneyLocation";
import {getJourneyChoices} from "../journeys/journeyChoices";
import type {Coordinates} from "../dto/coordinates.dto";
import {defineStore} from "pinia";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {Journey, JourneyFields} from "../dto/journey.dto";
import {
    createEphemeralJourney,
    JourneyMemorySchema,
    type ActiveJourney,
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
    activeJourney: ActiveJourney; //todo: this is badly named, it's not necessarily a Journey (if its predicted or saved), think of a better name; activeJourneyDetails can just be activeJourney then
    currentCoordinates: Coordinates | null;
}

export const useJourneySelectionStore = defineStore("journey-selection", {
    state: (): JourneySelectionState => ({
        isInitialised: false,
        recentJourneyIds: [],
        recentEphemeralJourneys: [],
        activeJourney: {type: "predicted"},
        currentCoordinates: null,
    }),

    getters: {
        currentEphemeralJourney(state): EphemeralJourney | undefined {
            //todo: do we need this check? is it really only checking if the ephemeral journey was entered correctly ie if it has for both endpoints a station or a valid station group? I think we can assume it was entered correctly
            return state.activeJourney.type === "ephemeral"
                && hasJourneyEndpoints(state.activeJourney.journey, useDashboardConfigStore().config.stationGroups)
                    ? state.activeJourney.journey
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
                    .filter((journey) => hasJourneyEndpoints(journey, config.stationGroups))
                    .map((journey) => [journey.id, journey])
            );
        },

        activeJourneyId(state): string | undefined {
            if (state.activeJourney.type === "predicted") {
                return this.predictedJourneyId;
            }

            return state.activeJourney.type === "saved"
                ? state.activeJourney.id
                : this.currentEphemeralJourney?.id;
        },

        activeJourneyDetails(): Journey | undefined {
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
            const configStore = useDashboardConfigStore();

            useJourneyLocation(
                () => configStore.config.shouldUseLocation,
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
            const configStore = useDashboardConfigStore();

            const savedJourney = configStore.config.journeys
                .some((journey) => journey.id === journeyId);
            const ephemeralJourney = this.recentEphemeralJourneys.find((journey) => journey.id === journeyId)
                ?? this.currentEphemeralJourney;

            this.activeJourney = savedJourney
                ? {type: "saved", id: journeyId}
                : {type: "ephemeral", journey: ephemeralJourney!};
            this.recentJourneyIds = [
                journeyId,
                ...this.recentJourneyIds.filter((id) => id !== journeyId),
            ].slice(0, 50);

            this.saveRecentJourneysInStorage();
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

            if (existingJourney) {
                this.selectJourney(existingJourney.id);
                return;
            }

            this.recentEphemeralJourneys.push(parsedJourney);
            this.selectJourney(parsedJourney.id);
        },

        saveActiveJourney(): void {
            if (
                !this.isInitialised 
                || this.activeJourney.type !== "ephemeral" 
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
            this.activeJourney = {type: "saved", id: savedJourney.id};
            this.saveRecentJourneysInStorage();
        },

        editActiveJourney(fields: JourneyFields): void {
            const activeJourneyDetails = this.activeJourneyDetails;

            if (
                !this.isInitialised 
                || this.activeJourney.type === "predicted" 
                || !activeJourneyDetails
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
                this.recentEphemeralJourneys = this.recentEphemeralJourneys.map((journey) =>
                    journey.id === updatedJourney.id ? updatedJourney : journey
                );
                this.activeJourney = {type: "ephemeral", journey: updatedJourney};
                this.saveRecentJourneysInStorage();
                return;
            }

            useDashboardConfigStore().updateJourney({
                id: activeJourneyDetails.id,
                ...fields,
            });
        },

        removeRecentJourney(journeyId: string): void {
            if (!this.isInitialised || !this.recentJourneyIds.includes(journeyId)) {
                return;
            }

            this.recentJourneyIds = this.recentJourneyIds.filter(
                (recentJourneyId) => recentJourneyId !== journeyId
            );
            this.saveRecentJourneysInStorage();
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

            this.saveRecentJourneysInStorage();
        },

        resetActiveJourneyToPredicted(): void {
            if (!this.isInitialised) {
                return
            }
            this.activeJourney = {type: "predicted"};
        },

        saveRecentJourneysInStorage(): void {
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
