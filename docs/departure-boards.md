# Departure-board requests

The dashboard requests departure boards after it expands the active journey into station routes.

## Request sequence

```mermaid
sequenceDiagram
    participant Dashboard as getDashboardJourneys
    participant Boards as getDepartureBoards
    participant Parser as getDirectTrainLegs
    participant API as Rail Data Marketplace

    Dashboard->>Boards: Routes and current time
    Boards->>API: Request direct and first-train boards
    API-->>Boards: Up to ten services per board
    Boards->>Parser: Parse catchable first-train legs
    alt Connected route has fewer than six first trains
        Boards->>API: Request later first-train board at 119-minute offset
        API-->>Boards: Later first-train services
        Boards->>Boards: Merge first-train services
        Boards->>Parser: Parse combined first-train board
    end
    Parser-->>Boards: Sorted transfer-ready times
    loop Until all transfer-ready times have onward coverage
        Boards->>API: Request onward board from next uncovered time
        API-->>Boards: Onward services
        Boards->>Parser: Parse onward departure times
        Boards->>Boards: Merge services and find next uncovered time
    end
    Boards-->>Dashboard: Departure boards keyed by station pair
```

## Request rules

Direct routes request the origin-to-destination board. The request starts after the configured origin walk.

Connected routes first request the origin-to-connection board. The app parses the catchable first trains before it requests onward trains.

If the first board has fewer than six catchable trains, the app requests one more board. This request uses the maximum 119-minute offset.

The app merges and deduplicates both first-train boards. It then finds the transfer-ready time for each catchable first train.

Each transfer-ready time is the first-train arrival plus three minutes. The first onward request starts at the earliest transfer-ready time.

The app compares the last onward departure with the remaining transfer-ready times. If a later first train is not covered, another request starts at its transfer-ready time.

The app repeats this process until no transfer-ready times remain. An empty response advances the process to the next transfer-ready time.

Each request asks for ten rows in a 120-minute window. The time offset is limited to 119 minutes.

Identical station-pair and offset requests share one promise during a planning request.

All responses for one station pair are merged and deduplicated. This includes overlapping responses and responses used by several routes.

## Source map

- `src/trainDashboard/journeys/timetable/departureBoards.ts` creates requests, applies offsets, caches requests, and merges onward boards.
- `src/trainDashboard/journeys/timetable/trainLegs.ts` parses services and arrival times.
- `src/trainDashboard/api/railDataMarketplace.api.ts` sends and validates Rail Data Marketplace requests.
- `src/trainDashboard/dto/liveDepartureBoard.dto.ts` defines validated departure-board data.
