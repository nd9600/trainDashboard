import {afterEach, describe, expect, it, vi} from "vitest";
import type {DepartureBoardRequest} from "../../api/railDataMarketplace.api";
import * as railDataMarketplaceApi from "../../api/railDataMarketplace.api";
import type {DepartureService} from "../../dto/liveDepartureBoard.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDepartureBoard, getDepartureBoards} from "./departureBoards";

describe("connected-route departure boards", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("loads a later sparse first-train board before requesting onward trains", async () => {
        const requests: DepartureBoardRequest[] = [];
        vi.spyOn(
            railDataMarketplaceApi,
            "fetchDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => {
            requests.push(request);

            if (request.originCrs === "HTC") {
                return {
                    crs: "HTC",
                    trainServices:
                        request.timeOffsetMinutes === 119
                            ? [service("later-first", "13:05", "MAN", "13:10")]
                            : [
                                  service(
                                      "initial-first",
                                      "11:05",
                                      "MAN",
                                      "11:10"
                                  ),
                              ],
                };
            }

            return {
                crs: "MAN",
                trainServices:
                    request.timeOffsetMinutes === 119
                        ? [service("later-onward", "13:20", "LIV", "14:00")]
                        : [service("initial-onward", "11:30", "LIV", "12:10")],
            };
        });

        const boards = await getDepartureBoards(
            "test-key",
            [connectedRoute],
            11 * 60
        );

        expect(
            requests.map(
                (request) =>
                    `${request.originCrs}-${request.destinationCrs}:${request.timeOffsetMinutes}`
            )
        ).toEqual(["HTC-MAN:0", "HTC-MAN:119", "MAN-LIV:13", "MAN-LIV:119"]);
        expect(
            getDepartureBoard(boards, "HTC", "MAN", 0).trainServices.map(
                (trainService) => trainService.serviceID
            )
        ).toEqual(["initial-first", "later-first"]);
    });

    it("does not extend a first-train board that has six catchable trains", async () => {
        const requests: DepartureBoardRequest[] = [];
        const sixFirstTrains = Array.from({length: 6}, (_, index) => {
            const departureMinutes = 11 * 60 + 5 + index * 10;

            return service(
                `first-${index}`,
                formatApiTime(departureMinutes),
                "MAN",
                formatApiTime(departureMinutes + 5)
            );
        });
        vi.spyOn(
            railDataMarketplaceApi,
            "fetchDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => {
            requests.push(request);

            return {
                crs: request.originCrs,
                trainServices:
                    request.originCrs === "HTC"
                        ? sixFirstTrains
                        : [service("onward", "12:50", "LIV", "13:30")],
            };
        });

        await getDepartureBoards("test-key", [connectedRoute], 11 * 60);

        expect(
            requests
                .filter((request) => request.originCrs === "HTC")
                .map((request) => request.timeOffsetMinutes)
        ).toEqual([0]);
    });

    it("requests onward trains for each uncovered transfer time", async () => {
        const requests: DepartureBoardRequest[] = [];
        mockDepartureBoards(requests, {
            13: [service("onward-one", "11:30", "LIV", "12:10")],
            53: [service("onward-two", "12:10", "LIV", "12:50")],
            93: [service("onward-three", "12:50", "LIV", "13:30")],
        });

        const boards = await getDepartureBoards(
            "test-key",
            [connectedRoute],
            11 * 60
        );

        expect(
            requests
                .filter((request) => request.originCrs === "MAN")
                .map((request) => request.timeOffsetMinutes)
        ).toEqual([13, 53, 93]);
        expect(
            getDepartureBoard(boards, "MAN", "LIV", 0).trainServices
        ).toHaveLength(3);
    });

    it("deduplicates services returned by overlapping onward requests", async () => {
        const requests: DepartureBoardRequest[] = [];
        const duplicateService = service("duplicate", "11:30", "LIV", "12:10");
        mockDepartureBoards(requests, {
            13: [duplicateService],
            53: [duplicateService, service("later", "12:10", "LIV", "12:50")],
        });

        const boards = await getDepartureBoards(
            "test-key",
            [connectedRoute],
            11 * 60
        );

        expect(
            getDepartureBoard(boards, "MAN", "LIV", 0).trainServices.map(
                (trainService) => trainService.serviceID
            )
        ).toEqual(["duplicate", "later"]);
    });

    it("stops after trying each uncovered transfer time when no onward trains exist", async () => {
        const requests: DepartureBoardRequest[] = [];
        mockDepartureBoards(requests, {});

        const boards = await getDepartureBoards(
            "test-key",
            [connectedRoute],
            11 * 60
        );

        expect(
            requests
                .filter((request) => request.originCrs === "MAN")
                .map((request) => request.timeOffsetMinutes)
        ).toEqual([13, 53, 93]);
        expect(
            getDepartureBoard(boards, "MAN", "LIV", 0).trainServices
        ).toEqual([]);
    });
});

const connectedRoute: JourneyRoute = {
    id: "journey:HTC-LIV",
    journeyId: "journey",
    origin: {
        crs: "HTC",
        walkMinutes: 0,
        locationName: "Heaton Chapel",
    },
    destination: {
        crs: "LIV",
        walkMinutes: 0,
        locationName: "Liverpool Lime Street",
    },
    viaCrs: "MAN",
};

const firstTrainServices = [
    service("first-one", "11:05", "MAN", "11:10"),
    service("first-two", "11:45", "MAN", "11:50"),
    service("first-three", "12:25", "MAN", "12:30"),
];

function mockDepartureBoards(
    requests: DepartureBoardRequest[],
    onwardServicesByOffset: Partial<Record<number, DepartureService[]>>
): void {
    vi.spyOn(railDataMarketplaceApi, "fetchDepartureBoard").mockImplementation(
        async (_consumerKey, request) => {
            requests.push(request);

            return {
                crs: request.originCrs,
                trainServices:
                    request.originCrs === "HTC"
                        ? firstTrainServices
                        : (onwardServicesByOffset[
                              request.timeOffsetMinutes ?? 0
                          ] ?? []),
            };
        }
    );
}

function service(
    serviceID: string,
    departure: string,
    destinationCrs: string,
    arrival: string
): DepartureService {
    return {
        serviceID,
        std: departure,
        etd: "On time",
        isCancelled: false,
        subsequentCallingPoints: [
            {
                callingPoint: [
                    {
                        crs: destinationCrs,
                        st: arrival,
                        et: "On time",
                    },
                ],
            },
        ],
    };
}

function formatApiTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours.toString().padStart(2, "0")}:${remainingMinutes
        .toString()
        .padStart(2, "0")}`;
}
