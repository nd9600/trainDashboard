// Components use this shared model for both mobile cards and desktop charts.
export type SegmentKind = "wait" | "walk" | "train";

export interface Segment {
    kind: SegmentKind;
    start: number;
    end: number;
}

export interface TrainLeg {
    origin: string;
    destination: string;
    departure: number;
    arrival: number;
}

export interface Journey {
    id: string;
    origin: string;
    destination: string;
    contextLabel: string;
    railArrivalTime: string;
    arrivalLabel?: string;
    arrivalTime?: string;
    boldArrivalTime?: boolean;
    walkingTimesKnown: boolean;
    recommended?: boolean;
    segments: Segment[];
    trainLegs: TrainLeg[];
}
