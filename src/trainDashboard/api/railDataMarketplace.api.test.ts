import {afterEach, describe, expect, it, vi} from "vitest";
import {fetchDepartureBoard} from "./railDataMarketplace.api";

describe("fetchDepartureBoard", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("requests a filtered departure board from the JSON API", async () => {
        const fetchSpy = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    crs: "HTC",
                    filtercrs: "EDY",
                    trainServices: [],
                })
            )
        );
        vi.stubGlobal("fetch", fetchSpy);
        await fetchDepartureBoard("test-consumer-key", {
            originCrs: "htc",
            destinationCrs: "edy",
            numberOfRows: 6,
            timeOffsetMinutes: 12,
            timeWindowMinutes: 90,
        });

        expect(fetchSpy).toHaveBeenCalledOnce();
        const [url, options] = fetchSpy.mock.calls[0]!;
        expect(url.toString()).toBe(
            "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepBoardWithDetails/HTC?numRows=6&filterCrs=EDY&filterType=to&timeOffset=12&timeWindow=90"
        );
        expect(options).toEqual({
            headers: {
                Accept: "application/json",
                "x-apikey": "test-consumer-key",
            },
        });
    });
});
