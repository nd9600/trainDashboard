import {createPinia, setActivePinia} from "pinia";
import {createSSRApp} from "vue";
import {renderToString} from "vue/server-renderer";
import {afterEach, expect, it, vi} from "vitest";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import type {JourneyPredictionReason} from "../../journeys/journeyPrediction";
import JourneyPredictionExplanation from "./JourneyPredictionExplanation.vue";

afterEach(() => vi.unstubAllGlobals());

it.each([
    [{type: "nearby"}, "We think you are near Work. Choose a journey below."],
    [
        {type: "saved", onlyJourney: true},
        "This is your only saved journey from Work.",
    ],
    [
        {type: "saved", onlyJourney: false},
        "This is your first saved journey from Work.",
    ],
    [
        {type: "schedule", scheduleId: "evening", timing: "upcoming"},
        "is your next schedule from Work.",
    ],
    [
        {type: "schedule", scheduleId: "evening", timing: "active"},
        "schedule selects this journey.",
    ],
] satisfies [JourneyPredictionReason, string][])(
    "explains %j",
    async (reason, text) => {
        vi.stubGlobal("localStorage", {
            getItem: () =>
                JSON.stringify({
                    version: 3,
                    stationGroups: [],
                    journeys: [],
                    schedules: [],
                }),
            setItem: vi.fn(),
        });
        const pinia = createPinia();
        setActivePinia(pinia);
        useDashboardConfigStore().saveConfig({
            version: 3,
            stationGroups: [
                {id: "work", name: "Work", stations: [{crs: "CHC"}]},
            ],
            journeys: [],
            schedules: [
                {
                    id: "evening",
                    name: "Evening",
                    days: [1],
                    startsAt: "17:00",
                    endsAt: "18:00",
                    journeyId: "back",
                },
            ],
        });
        const props = {
            isPredicted: true,
            prediction: {
                predictedJourneyId: undefined,
                alternativeJourneyIds: [],
                nearbyStationGroupId: "work",
                reason,
            },
        };
        const app = createSSRApp(JourneyPredictionExplanation, props);
        app.use(pinia);
        expect(await renderToString(app)).toContain(text);

        const manualApp = createSSRApp(JourneyPredictionExplanation, {
            ...props,
            isPredicted: false,
        });
        manualApp.use(pinia);
        const manualHtml = await renderToString(manualApp);
        expect(manualHtml).toContain(">We think you are near Work.</p>");
    }
);
