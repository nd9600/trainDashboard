import {expect, it} from "vitest";
import {createSSRApp} from "vue";
import {renderToString} from "vue/server-renderer";
import type {Journey} from "../../../dto/journey.dto";
import JourneyForm from "./JourneyForm.vue";

it.each([
    ["MAN", "LIV", false],
    ["MAN", "MAN", true],
    ["", "LIV", true],
] as const)("sets submit availability for %s to %s", async (origin, destination, isDisabled) => {
    const journey: Journey = {
        id: "test-journey",
        origin: {type: "station", crs: origin},
        destination: {type: "station", crs: destination},
    };

    const html = await renderToString(createSSRApp(JourneyForm, {initialJourney: journey}));

    const submitButton = html.match(/<button[^>]*type="submit"[^>]*>/)?.[0];
    expect(submitButton).toBeDefined();
    expect(submitButton?.includes("disabled")).toBe(isDisabled);
});
