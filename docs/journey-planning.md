# Journey planning

Journey planning starts with one resolved active journey. See [journey selection](journey-selection.md) for how the app selects that journey.

## Planning flow

```mermaid
flowchart LR
    journey[Active journey]
    routes[Station routes]
    timetables[Route timetables]
    planner[planTimetabledJourneys]
    journeys[Catchable journeys sorted by finish time]
    display[First six journeys]

    journey --> routes
    routes --> timetables
    timetables --> planner
    planner --> journeys
    journeys --> display
```

`getStationRoutes` expands station groups into concrete origin and destination pairs. It removes pairs that use the same station.

A configured connecting station creates a direct route and a connected route. It creates only a direct route when the connecting station is an endpoint.

See [departure-board requests](departure-boards.md) for how the app loads direct, first-train, and onward trains.

Each route timetable contains its station route and parsed train legs. A direct route contains first-train legs only. A connected route also contains onward-train legs.

`planTimetabledJourneys` accepts route timetables. It hides train matching, connection rules, section construction, filtering, sorting, and recommendation.

## Call graph

```mermaid
flowchart TD
    dashboard[getDashboardJourneys]
    routes[getStationRoutes]
    load[loadRouteTimetables]
    requests[createDepartureBoardLoader]
    first[loadFirstTrainsForRoutes]
    onward[loadOnwardDepartureBoard]
    plan[planTimetabledJourneys]
    trainPlans[getTrainPlans]
    make[makeTimetabledJourney]

    dashboard --> routes
    dashboard --> load
    load --> requests
    load --> first
    load --> onward
    first --> requests
    onward --> requests
    dashboard --> plan
    plan --> trainPlans
    plan --> make
```

## Connection construction

```mermaid
flowchart TD
    onward[Take one onward train]
    matching[Find catchable first trains]
    any{Any first trains?}
    discard[Discard this onward train]
    order[Order first trains by latest departure]
    plan[Use the latest first train]
    firstAlternatives[Attach earlier first trains as alternatives]
    group[Group plans that use the same first train]
    onwardMain[Show the onward train that arrives first]
    onwardAlternatives[Attach other onward trains as alternatives]

    onward --> matching
    matching --> any
    any -->|No| discard
    any -->|Yes| order
    order --> plan
    plan --> firstAlternatives
    firstAlternatives --> group
    group --> onwardMain
    onwardMain --> onwardAlternatives
```

A catchable first train must meet all these rules:

- The passenger can complete the origin walk before departure.
- The first train arrives at least three minutes before the onward train departs.
- The first and onward trains have different service IDs.

## Filtering and ordering

The planner adds walk, train, and wait sections to each train plan.

It removes a journey when its first section starts before the current time. This includes the origin walk when its duration is known.

It sorts journeys by the end of the final section. This includes the destination walk when its duration is known.

When two journeys finish together, the journey that starts later comes first.

The first sorted journey with known origin and destination walking times is recommended.

## Presentation

```mermaid
flowchart LR
    planned[All sorted journeys]
    platforms[Find consistent platforms]
    firstSix[Take the first six]
    adjust[Hide consistent platform numbers]
    mobile[Mobile cards]
    desktop[Desktop charts]

    planned --> platforms
    planned --> firstSix
    platforms --> adjust
    firstSix --> adjust
    adjust --> mobile
    adjust --> desktop
```

The planner returns all sorted journeys. `JourneyTimelines` applies the six-journey display limit.

Platform consistency uses all planned journeys. A platform is hidden when multiple services use the same known platform for one station pair.

## Source map

- `src/trainDashboard/journeys/getDashboardJourneys.ts` expands the active journey, loads route timetables, and calls the planner.
- `src/trainDashboard/journeys/planning/journeyRoutes.ts` expands a journey into concrete station routes.
- `src/trainDashboard/journeys/timetable/loadRouteTimetables.ts` loads the train legs for each station route.
- `src/trainDashboard/journeys/timetable/departureBoards.ts` owns cached departure-board requests and response merging.
- `src/trainDashboard/journeys/timetable/firstTrainRequests.ts` loads initial and sparse first-train boards.
- `src/trainDashboard/journeys/timetable/onwardTrainRequests.ts` loads enough onward windows for all transfer-ready times.
- `src/trainDashboard/journeys/timetable/planTimetabledJourneys.ts` owns planning rules and returns sorted, recommended journeys.
- `src/trainDashboard/journeys/timetable/trainPlans.ts` matches direct and connected train legs and selects alternatives.
- `src/trainDashboard/journeys/timetable/makeTimetabledJourney.ts` adds walk, wait, and train sections.
- `src/trainDashboard/journeys/timetable/trainLegs.ts` converts departure services into timed train legs.
- `src/trainDashboard/journeys/timetable/planTimetabledJourneys.test.ts` contains a worked connected-journey example.
- `src/trainDashboard/dto/timetabledJourney.dto.ts` defines the planned journey and section shapes.
- `src/trainDashboard/components/journeys/JourneyTimelines.vue` limits results and prepares platform display.
- `src/trainDashboard/components/journeys/JourneyCards.vue` shows mobile journeys.
- `src/trainDashboard/components/journeys/JourneyCharts.vue` shows desktop journeys.
