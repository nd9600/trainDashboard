import {
    departureBoardSchema,
    type DepartureBoard,
} from "../dto/liveDepartureBoard.dto";

export interface DepartureBoardRequest {
    originCrs: string;
    destinationCrs: string;
    numberOfRows?: number;
    timeOffsetMinutes?: number;
    timeWindowMinutes?: number;
}

export interface RailDataMarketplaceApi {
    getDepartureBoard(request: DepartureBoardRequest): Promise<DepartureBoard>;
}

export interface RailDataMarketplaceApiCredentials {
    consumerKey: string;
}

const railDataMarketplaceBaseUrl =
    "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/";

export function createRailDataMarketplaceApi(
    credentials: RailDataMarketplaceApiCredentials
): RailDataMarketplaceApi {
    return {
        async getDepartureBoard(request): Promise<DepartureBoard> {
            const originCrs = request.originCrs.toUpperCase();
            const destinationCrs = request.destinationCrs.toUpperCase();
            const url = new URL(
                `GetDepBoardWithDetails/${encodeURIComponent(originCrs)}`,
                railDataMarketplaceBaseUrl
            );

            url.searchParams.set("numRows", String(request.numberOfRows ?? 10));
            url.searchParams.set("filterCrs", destinationCrs);
            url.searchParams.set("filterType", "to");
            url.searchParams.set(
                "timeOffset",
                String(request.timeOffsetMinutes ?? 0)
            );
            url.searchParams.set(
                "timeWindow",
                String(request.timeWindowMinutes ?? 120)
            );

            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "x-apikey": credentials.consumerKey,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `The Rail Data Marketplace request failed with status ${response.status}.`
                );
            }

            return departureBoardSchema.parse(await response.json());
        },
    };
}
