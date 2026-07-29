export type SegmentKind = "walk" | "train";

export interface Segment {
    kind: SegmentKind;
    start: number;
    end: number;
}

export interface Journey {
    id: string;
    origin: string;
    destination: string;
    label: string;
    arrivalLabel: string;
    arrivalTime: string;
    boldArrivalTime?: boolean;
    recommended?: boolean;
    segments: Segment[];
}
