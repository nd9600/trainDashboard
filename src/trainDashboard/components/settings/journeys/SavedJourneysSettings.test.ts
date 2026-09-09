import {afterEach, expect, it, vi} from "vitest";
import {createSSRApp} from "vue";
import {createPinia, setActivePinia} from "pinia";
import {renderToString} from "vue/server-renderer";
import {useJourneySelectionStore} from "../../../store/journeySelection.store";
import type {Journey} from "../../../dto/journey.dto";
import SavedJourneysSettings from "./SavedJourneysSettings.vue";

afterEach(() => vi.unstubAllGlobals());

it("lists every recent journey and protects a scheduled saved journey", async () => {
    vi.stubGlobal("localStorage", {
        getItem: () =>
            JSON.stringify({
                version: 3,
                stationGroups: [],
                journeys: [],
                schedules: [],
            }),
    });
    const pinia = createPinia();
    setActivePinia(pinia);
    const selection = useJourneySelectionStore();
    selection.ephemeralJourneys = ["ANL", "PTK", "HYN", "GLQ"].map((crs) => ({
        id: crs,
        origin: {type: "station", crs},
        destination: {type: "station", crs: "CHC"},
    }));
    const journeys: Journey[] = [selection.ephemeralJourneys[0]!];
    const recentJourneyIds = ["ANL", "PTK", "HYN", "GLQ"];
    const app = createSSRApp(SavedJourneysSettings, {
        journeys,
        recentJourneyIds,
        stationGroups: [],
        schedules: [
            {
                id: "morning",
                name: "Morning commute",
                days: [1],
                startsAt: "08:00",
                endsAt: "09:00",
                journeyId: "ANL",
            },
        ],
    });
    app.use(pinia);

    const html = await renderToString(app);

    expect(html.match(/data-test="recent-journey"/g)).toHaveLength(4);
    expect(html).toContain("Morning commute");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>\s*Remove\s*<\/button>/);
    expect(html.match(/Save journey/g)).toHaveLength(3);
});
