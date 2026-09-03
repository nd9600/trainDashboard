import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";

export const minimumTransferMinutes = 3;

export function getDirectTrainLegs(
    board: DepartureBoard,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): TrainLeg[] {
    const trainLegs: TrainLeg[] = [];

    for (const service of board.trainServices) {
        const trainLeg = getTrainLeg(
            service,
            originCrs,
            destinationCrs,
            currentMinutes
        );

        if (trainLeg) {
            trainLegs.push(trainLeg);
        }
    }

    return trainLegs.sort(
        (first, second) => first.departure - second.departure
    );
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
        .find(
            (callingPoint) =>
                callingPoint.crs.toUpperCase() === destinationCrs.toUpperCase()
        );

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
        getLiveOrScheduledTime(
            destinationCallingPoint.et,
            destinationCallingPoint.st
        ),
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
        arrival,
    };
}

function getMinutesOnOrAfter(
    time: string,
    referenceMinutes: number
): number | undefined {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return undefined;
    }

    const [hours, minutes] = time.split(":").map(Number);
    let result =
        hours! * 60 + minutes! + Math.floor(referenceMinutes / 1440) * 1440;

    while (result < referenceMinutes) {
        result += 1440;
    }

    return result;
}

function getLiveOrScheduledTime(
    liveTime: string | null | undefined,
    scheduledTime: string
): string {
    return liveTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(liveTime)
        ? liveTime
        : scheduledTime;
}
