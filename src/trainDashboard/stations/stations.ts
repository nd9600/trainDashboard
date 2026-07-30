import {stationNames} from "./stationNames";

// These helpers provide the app-specific view of the static station mapping.
export function stationName(code: string): string {
    return stationNames[code] ?? code;
}

export interface StationOption {
    code: string;
    label: string;
    name: string;
}

export const stationOptions: StationOption[] = Object.entries(stationNames)
    .map(([code, name]) => ({
        code,
        label: `${name} (${code})`,
        name,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));

const stationCodesByName = Object.fromEntries(
    Object.entries(stationNames).map(([code, name]) => [
        name.toLowerCase(),
        code,
    ])
);

export function stationDisplayName(code: string): string {
    const normalisedCode = code.trim().toUpperCase();
    const name = stationNames[normalisedCode];

    return name ? `${name} (${normalisedCode})` : code;
}

export function stationCodeFromInput(value: string): string {
    const trimmedValue = value.trim();
    const codeFromLabel = trimmedValue.match(/\(([A-Z]{3})\)$/i)?.[1];

    if (
        codeFromLabel &&
        stationNames[codeFromLabel.toUpperCase()] !== undefined
    ) {
        return codeFromLabel.toUpperCase();
    }

    const possibleCode = trimmedValue.toUpperCase();
    if (stationNames[possibleCode] !== undefined) {
        return possibleCode;
    }

    return stationCodesByName[trimmedValue.toLowerCase()] ?? possibleCode;
}

export function findStationOptions(
    query: string,
    limit: number = 10
): StationOption[] {
    const normalisedQuery = query.trim().toLowerCase();

    if (!normalisedQuery) {
        return stationOptions.slice(0, limit);
    }

    return stationOptions
        .filter(
            (station) =>
                station.name.toLowerCase().includes(normalisedQuery) ||
                station.code.toLowerCase().includes(normalisedQuery)
        )
        .sort(
            (first, second) =>
                stationMatchRank(first, normalisedQuery) -
                    stationMatchRank(second, normalisedQuery) ||
                first.name.localeCompare(second.name)
        )
        .slice(0, limit);
}

function stationMatchRank(
    station: StationOption,
    normalisedQuery: string
): number {
    const code = station.code.toLowerCase();
    const name = station.name.toLowerCase();

    if (code === normalisedQuery) {
        return 0;
    }

    if (code.startsWith(normalisedQuery)) {
        return 1;
    }

    if (name.startsWith(normalisedQuery)) {
        return 2;
    }

    return 3;
}
