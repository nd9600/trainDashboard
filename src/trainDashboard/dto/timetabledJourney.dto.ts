export type SegmentKind = "wait" | "walk" | "train";

export interface Segment {
    kind: SegmentKind;
    start: number;
    end: number;
}

export interface TrainLeg {
    serviceId: string;
    origin: string;
    destination: string;
    departure: number;
    arrival: number;
    platform?: string | null;
    alternativeTrainLegs?: TrainLeg[];
}

export interface TimetabledJourney {
    id: string;
    journeyId: string;
    origin: string;
    originLocationName: string;
    destination: string;
    destinationLocationName: string;
    railArrivalTime: string;
    arrivalLabel?: string;
    arrivalTime?: string;
    boldArrivalTime?: boolean;
    walkingTimesKnown: boolean;
    recommended?: boolean;
    segments: Segment[];
    trainLegs: TrainLeg[];
}
