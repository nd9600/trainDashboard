import {expect, it} from "vitest";
import {createSSRApp} from "vue";
import {renderToString} from "vue/server-renderer";
import {makeTimetabledJourney} from "../../../../journeys/timetable/makeTimetabledJourney";
import JourneyChartSvg from "./JourneyChartSvg.vue";

it.each([
    ["Home", 5, true],
    ["Work", 5, false],
    ["Home", undefined, false],
] as const)("formats arrival at %s with walk time %s", async (locationName, walkMinutes, isBold) => {
    const journey = makeTimetabledJourney({
        route: {
            id: "man-to-htc",
            journeyId: "home",
            origin: {crs: "MAN", locationName: "Manchester Piccadilly"},
            destination: {crs: "HTC", locationName, walkMinutes},
        },
        trainLegs: [
            {serviceId: "train", origin: "MAN", destination: "HTC", departure: 600, arrival: 610},
        ],
    });

    const html = await renderToString(createSSRApp(JourneyChartSvg, {
        journeys: [journey],
        currentMinutes: 590,
        windowStart: 585,
        windowEnd: 630,
        rowStart: 80,
        rowGap: 60,
    }));

    const arrivalTime = html.match(/<tspan[^>]*>[^<]*<\/tspan>/)?.[0];
    expect(arrivalTime).toContain(walkMinutes === undefined ? "10:10" : "10:15");
    expect(arrivalTime?.includes("font-bold")).toBe(isBold);
});
