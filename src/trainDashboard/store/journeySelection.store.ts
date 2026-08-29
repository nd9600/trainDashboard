import {defineStore} from "pinia";
import type {
    DisplaySchedule,
    Journey,
    JourneyFields,
} from "../dto/dashboardConfig.dto";
import {
    createEphemeralJourney,
    type ActiveJourney,
    type JourneyChoiceGroup,
} from "../dto/journeySelection.dto";
import {
    loadJourneySelectionState,
    saveJourneySelectionMemory,
    type JourneySelectionState,
} from "../journeys/journeyMemory";
import {
    getActiveJourneyUpdate,
    getActiveSchedule,
    getJourneyChoices,
    getJourneysById,
    getPredictedJourneyId,
    hasSameJourneyFields,
    normaliseActiveJourney,
    replaceJourneyId,
} from "../journeys/journeySelection";
import {useDashboardClockStore} from "./dashboardClock.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";

export const useJourneySelectionStore = defineStore("journey-selection", {
    state: (): JourneySelectionState => loadJourneySelectionState(),

    getters: {
        activeSchedule(): DisplaySchedule | undefined {
            const config = useDashboardConfigStore().config;
            const currentClock = useDashboardClockStore().currentClock;
            return getActiveSchedule(config.schedules, currentClock);
        },

        predictedJourneyId(state): string | undefined {
            return getPredictedJourneyId(
                this.activeSchedule,
                state.predictionRecentJourneyIds,
                getJourneysById(
                    state.ephemeralJourneys,
                    useDashboardConfigStore().config.journeys
                )
            );
        },

        activeJourneyId(state): string | undefined {
            return state.activeJourney.type === "predicted"
                ? this.predictedJourneyId
                : state.activeJourney.id;
        },

        activeJourneyDetails(state): Journey | undefined {
            return this.activeJourneyId
                ? getJourneysById(
                      state.ephemeralJourneys,
                      useDashboardConfigStore().config.journeys
                  ).get(this.activeJourneyId)
                : undefined;
        },

        activeJourneyIsEphemeral(): boolean {
            const savedJourneyIds = new Set(
                useDashboardConfigStore().config.journeys.map(
                    (journey) => journey.id
                )
            );
            return (
                this.activeJourneyId !== undefined &&
                !savedJourneyIds.has(this.activeJourneyId)
            );
        },

        journeyChoices(state): JourneyChoiceGroup[] {
            const savedJourneys = useDashboardConfigStore().config.journeys;
            return getJourneyChoices(
                savedJourneys,
                state.recentJourneyIds,
                this.predictedJourneyId,
                getJourneysById(state.ephemeralJourneys, savedJourneys)
            );
        },
    },

    actions: {
        selectJourney(journeyId: string): boolean {
            const savedJourneys = useDashboardConfigStore().config.journeys;
            const journeysById = getJourneysById(
                this.ephemeralJourneys,
                savedJourneys
            );

            if (!journeysById.has(journeyId)) {
                return false;
            }

            const savedJourneyIds = new Set(
                savedJourneys.map((journey) => journey.id)
            );
            const selection: ActiveJourney =
                journeyId === this.predictedJourneyId
                    ? {type: "predicted"}
                    : savedJourneyIds.has(journeyId)
                      ? {type: "saved", id: journeyId}
                      : {type: "ephemeral", id: journeyId};

            this.$patch(
                getActiveJourneyUpdate(
                    this,
                    selection,
                    this.activeJourneyId,
                    this.predictedJourneyId,
                    savedJourneyIds
                )
            );
            this.ephemeralJourneys = saveJourneySelectionMemory(this);
            return true;
        },

        selectEphemeralJourney(fields: JourneyFields): boolean {
            const parsedJourney = createEphemeralJourney(fields);

            if (!parsedJourney) {
                return false;
            }

            const savedJourneys = useDashboardConfigStore().config.journeys;
            const journeysById = getJourneysById(
                this.ephemeralJourneys,
                savedJourneys
            );
            const existingJourney = [...journeysById.values()].find((journey) =>
                hasSameJourneyFields(journey, parsedJourney)
            );

            if (existingJourney) {
                return this.selectJourney(existingJourney.id);
            }

            const journey = createEphemeralJourney(
                fields,
                journeysById.keys()
            )!;
            const activeJourneyId = this.activeJourneyId;
            const predictedJourneyId = this.predictedJourneyId;
            const savedJourneyIds = new Set(
                savedJourneys.map((candidate) => candidate.id)
            );
            this.ephemeralJourneys = [...this.ephemeralJourneys, journey];
            this.$patch(
                getActiveJourneyUpdate(
                    this,
                    {type: "ephemeral", id: journey.id},
                    activeJourneyId,
                    predictedJourneyId,
                    savedJourneyIds
                )
            );
            this.ephemeralJourneys = saveJourneySelectionMemory(this);
            return true;
        },

        saveActiveJourney(): boolean {
            if (!this.activeJourneyIsEphemeral || !this.activeJourneyId) {
                return false;
            }

            const ephemeralJourneyId = this.activeJourneyId;
            const journey = getJourneysById(
                this.ephemeralJourneys,
                useDashboardConfigStore().config.journeys
            ).get(ephemeralJourneyId);

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
            this.ephemeralJourneys = saveJourneySelectionMemory(this);
            return true;
        },

        clearActiveJourney(): boolean {
            if (this.activeJourney.type !== "ephemeral") {
                return false;
            }

            const previousJourney = this.previousActiveJourneys.pop() ?? {
                type: "predicted" as const,
            };
            this.activeJourney = normaliseActiveJourney(
                previousJourney,
                this.predictedJourneyId,
                getJourneysById(
                    this.ephemeralJourneys,
                    useDashboardConfigStore().config.journeys
                )
            );
            this.ephemeralJourneys = saveJourneySelectionMemory(this);
            return true;
        },
    },
});
