import {afterEach, expect, it, vi} from "vitest";
import {createSSRApp} from "vue";
import {createPinia} from "pinia";
import {renderToString} from "vue/server-renderer";
import JourneySettings from "./JourneySettings.vue";

afterEach(() => vi.unstubAllGlobals());

it("opens the settings editor with reactive stored configuration", async () => {
    vi.stubGlobal("localStorage", {
        getItem: () =>
            JSON.stringify({
                version: 3,
                stationGroups: [],
                journeys: [],
                schedules: [],
            }),
    });
    const app = createSSRApp(JourneySettings);
    app.use(createPinia());
    const html = await renderToString(app);
    expect(html).toContain("Add station group");
});
