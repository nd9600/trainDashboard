import type {DepartureBoard, DepartureService} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";

export const minimumTransferMinutes = 3;

export function getDirectTrainLegs(
    board: DepartureBoard,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): TrainLeg[] {
    return board.trainServices
        .map((service) => getTrainLeg(service, originCrs, destinationCrs, currentMinutes))
        .filter((leg) => leg !== undefined)
        .sort((first, second) => first.departure - second.departure);
}

function getTrainLeg(
    service: DepartureService,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): TrainLeg | undefined {
    if (service.isCancelled) {
        return undefined;
    }

    const destinationCallingPoint = service.subsequentCallingPoints
        .flatMap((callingPoints) => callingPoints.callingPoint)
        .find((callingPoint) => callingPoint.crs.toUpperCase() === destinationCrs.toUpperCase());

    if (!destinationCallingPoint || destinationCallingPoint.isCancelled) {
        return undefined;
    }

    const departure = getMinutesOnOrAfter(
        getLiveOrScheduledTime(service.etd, service.std),
        currentMinutes - 60
    );

    if (departure === undefined) {
        return undefined;
    }

    const arrival = getMinutesOnOrAfter(
        getLiveOrScheduledTime(destinationCallingPoint.et, destinationCallingPoint.st),
        departure
    );

    if (arrival === undefined) {
        return undefined;
    }

    return {
        serviceId: service.serviceID,
        origin: originCrs,
        destination: destinationCrs,
        platform: service.platform,
        departure,
        // A train due before midnight can leave after midnight. Keep its scheduled date.
        scheduledDeparture: getMinutesOnOrAfter(service.std, departure - 720),
        arrival,
    };
}

function getMinutesOnOrAfter(time: string, referenceMinutes: number): number | undefined {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return undefined;
    }

    const [hours, minutes] = time.split(":").map(Number);
    let minutesOnOrAfterReference = hours! * 60 + minutes! + Math.floor(referenceMinutes / 1440) * 1440;

    while (minutesOnOrAfterReference < referenceMinutes) {
        minutesOnOrAfterReference += 1440;
    }

    return minutesOnOrAfterReference;
}

function getLiveOrScheduledTime(
    liveTime: string | null | undefined,
    scheduledTime: string
): string {
    return liveTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(liveTime) ? liveTime : scheduledTime;
}
