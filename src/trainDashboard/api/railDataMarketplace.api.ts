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

export async function getDepartureBoard(
    consumerKey: string,
    request: DepartureBoardRequest
): Promise<DepartureBoard> {
    const originCrs = request.originCrs.toUpperCase();
    const destinationCrs = request.destinationCrs.toUpperCase();
    const url = new URL(
        `GetDepBoardWithDetails/${encodeURIComponent(originCrs)}`,
        "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/"
    );

    url.search = new URLSearchParams({
        numRows: String(request.numberOfRows ?? 10),
        filterCrs: destinationCrs,
        filterType: "to",
        timeOffset: String(request.timeOffsetMinutes ?? 0),
        timeWindow: String(request.timeWindowMinutes ?? 120),
    }).toString();

    const response = await fetch(
        url,
        {
            headers: {
                Accept: "application/json",
                "x-apikey": consumerKey,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `The Rail Data Marketplace request failed with status ${response.status}.`
        );
    }

    return departureBoardSchema.parse(await response.json());
}
