import type {DepartureService} from "../dto/liveDepartureBoard.dto";

export function service(
    serviceID: string,
    departure: string,
    destinationCrs: string,
    arrival: string,
    etd = "On time",
    et = "On time"
): DepartureService {
    return {
        serviceID,
        std: departure,
        etd,
        isCancelled: false,
        subsequentCallingPoints: [{callingPoint: [{crs: destinationCrs, st: arrival, et}]}],
    };
}

export function formatApiTime(minutes: number): string {
    const normalised = ((minutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalised / 60)).padStart(2, "0")}:${String(normalised % 60).padStart(2, "0")}`;
}
