import {vi} from "vitest";
import * as railDataMarketplaceApi from "../../api/railDataMarketplace.api";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {loadRouteTimetables} from "./loadRouteTimetables";
import {planTimetabledJourneys} from "./planTimetabledJourneys";
import {service, formatApiTime} from "../../testing/departureService.fixture";

export function testApiAt(now: number): string {
    const routes: Record<string, {departureAfter: number; duration: number}> = {
        "HTC-EDY": {departureAfter: 20, duration: 16},
        "HTC-MAN": {departureAfter: 20, duration: 13},
        "MAN-LIV": {departureAfter: 30, duration: 50},
        "BNA-MAN": {departureAfter: 10, duration: 15},
    };

    mockDepartureBoards(
        Object.fromEntries(
            Object.entries(routes).map(([route, {departureAfter, duration}]) => [
                route,
                [departureAfter, departureAfter + 30].map((offset) =>
                    service(
                        `${route}-${now + offset}`,
                        formatApiTime(now + offset),
                        route.split("-")[1]!,
                        formatApiTime(now + offset + duration)
                    )
                ),
            ])
        )
    );

    return "test-key";
}

export function mockDepartureBoards(
    servicesByRoute: Record<string, ReturnType<typeof service>[]>
): void {
    vi.spyOn(railDataMarketplaceApi, "fetchDepartureBoard").mockImplementation(
        async (_consumerKey, request) => ({
            crs: request.originCrs,
            trainServices: servicesByRoute[`${request.originCrs}-${request.destinationCrs}`] ?? [],
        })
    );
}

export function journeyRoute(
    origin: string,
    destination: string,
    originWalkMinutes: number | undefined,
    destinationWalkMinutes: number | undefined,
    viaCrs?: string
): JourneyRoute {
    return {
        id: `journeys:${origin}-${destination}`,
        journeyId: "journeys",
        origin: {
            crs: origin,
            walkMinutes: originWalkMinutes,
            locationName: "Heaton Chapel",
        },
        destination: {
            crs: destination,
            walkMinutes: destinationWalkMinutes,
            locationName: "Manchester Piccadilly",
        },
        viaCrs,
    };
}

export async function getTimetabledJourneys(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    currentMinutes: number
) {
    const routeTimetables = await loadRouteTimetables(consumerKey, stationRoutes, currentMinutes);
    return planTimetabledJourneys(routeTimetables, currentMinutes);
}
