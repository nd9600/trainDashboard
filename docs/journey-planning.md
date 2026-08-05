# Journey planning

The dashboard converts the current time and saved settings into journeys that a passenger can catch.

```text
Current time
      ↓
Active schedule
      ↓
Configured journeys
      ↓
Concrete station routes
      ↓
Departure-board requests
      ↓
Direct trains and valid connections
      ↓
Walking and waiting sections
      ↓
Remove journeys you cannot catch
      ↓
Sort by arrival
      ↓
Show the first six
```

## Sequence diagram

```mermaid
sequenceDiagram
    participant UI as TrainDashboard
    participant Store as trainServices store
    participant Plan as Journey planning
    participant Timetable as Timetable builder
    participant API as Rail Data Marketplace

    UI->>Store: Read journey state
    Store->>Plan: getActiveJourneyPlan(config, currentClock)
    Plan->>Plan: Select the active schedule
    Plan->>Plan: Expand journeys into station routes
    Plan-->>Store: Primary and secondary routes

    par Primary routes
        Store->>Timetable: getTimetabledJourneys(...)
    and Secondary routes
        Store->>Timetable: getTimetabledJourneys(...)
    end

    Timetable->>API: fetchDepartureBoard(...) for each required station pair
    API-->>Timetable: Validated departure boards
    Timetable->>Timetable: Find direct trains and valid connections
    Timetable->>Timetable: Add walk, wait, and train sections
    Timetable->>Timetable: Remove journeys that have already started
    Timetable->>Timetable: Sort by final arrival, then latest start
    Timetable-->>Store: Timetabled journeys
    Store-->>UI: Primary and secondary journeys
    UI->>UI: Show the first six journeys in each list
```

Primary and secondary planning share one departure-board request cache. A station-pair request occurs only once during each refresh.

## Call graph

```mermaid
flowchart TD
    dashboard[TrainDashboard.vue]
    store[useTrainServicesStore]
    plan[getActiveJourneyPlan]
    active[isScheduleActive]
    routes[getRoutesForJourneys]
    stations[getStationsForLocation]
    options[getRouteOptions]
    refresh[refreshJourneys]
    timetable[getTimetabledJourneys]
    api[fetchDepartureBoard]
    direct[directLegs]
    service[createServiceLeg]
    journey[createJourney]
    sort[compareJourneys]
    missing[getRoutesWithoutTimetabledJourneys]
    timelines[JourneyTimelines.vue]
    cards[JourneyCards.vue]
    charts[JourneyCharts.vue]

    dashboard --> store
    store --> plan
    plan --> active
    plan --> routes
    routes --> stations
    routes --> options

    store --> refresh
    refresh --> timetable
    timetable --> api
    timetable --> direct
    direct --> service
    timetable --> journey
    timetable --> sort

    store --> missing
    dashboard --> timelines
    timelines -->|slice 0, 6| cards
    timelines -->|slice 0, 6| charts
```

## Source map

- `src/trainDashboard/store/trainServices.store.ts` coordinates each refresh.
- `src/trainDashboard/journeys/planning/activeJourneyPlan.ts` selects the active schedule.
- `src/trainDashboard/journeys/planning/journeyRoutes.ts` expands configured journeys into station routes.
- `src/trainDashboard/api/railDataMarketplace.api.ts` requests and validates departure boards.
- `src/trainDashboard/journeys/timetable/getTimetabledJourneys.ts` builds, filters, and sorts timetabled journeys.
- `src/trainDashboard/components/journeys/JourneyTimelines.vue` limits each displayed journey list to six results.

