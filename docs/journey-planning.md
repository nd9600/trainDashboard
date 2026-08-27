# Journey planning

The dashboard converts the current time and saved settings into journeys that a passenger can catch.

```text
Current time
      ↓
Active schedule
      ↓
Scheduled journey, or most recent valid journey
      ↓
Predicted journey
      ↓
Temporary saved-journey override, if selected
      ↓
Active journey
      ↓
Concrete station routes
      ↓
Departure-board requests
      ↓
Direct trains and valid connections
      ↓
Alternative trains grouped by shared first train
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
    participant Switcher as JourneySwitcher
    participant Store as trainServices store
    participant Selection as journeySelection store
    participant Pipeline as getDashboardJourneys
    participant Boards as Departure-board stage
    participant API as Rail Data Marketplace

    UI->>Store: Read journey state
    Store->>Selection: Load recent history for this page session
    Store->>Pipeline: getDashboardJourneys(config, currentClock, consumerKey, temporaryJourneyId, recentHistory)
    Pipeline->>Pipeline: getActiveSchedule(...)
    Pipeline->>Pipeline: getPredictedJourney(...)
    Pipeline->>Pipeline: getActiveJourney(...)
    Pipeline->>Pipeline: getStationRoutes(...)
    Pipeline->>Boards: getDepartureBoards(...)
    Boards->>API: fetchDepartureBoard(...) for each unique request
    API-->>Boards: Departure-board responses
    Boards-->>Pipeline: Validated departure boards
    Pipeline->>Pipeline: getTrainOptions(...)
    Pipeline->>Pipeline: combineAlternativeOnwardTrains(...)
    Pipeline->>Pipeline: makeTimetabledJourneys(...)
    Pipeline->>Pipeline: getCatchableJourneys(...)
    Pipeline->>Pipeline: sortJourneysByArrival(...)
    Pipeline-->>Store: Routes and timetabled journeys
    Store-->>UI: Routes and timetabled journeys
    UI->>UI: Show the first six journeys

    UI->>Switcher: Open predicted, recent, and saved journeys
    UI->>Switcher: Select a saved journey
    Switcher->>Selection: selectSavedJourney(...)
    Selection->>Selection: Keep override in memory and save history
    Selection-->>Store: Temporary journey changed
    Store->>Pipeline: Refresh the active journey
```

A station-pair request occurs only once during each planning request.

A matching schedule supplies the predicted journey. If no schedule matches, the most recent valid journey supplies the prediction.

The prediction uses the history loaded when the page starts. A new selection remains a temporary override during that page session. The selection immediately appears in the Recent section. A page refresh can use it as the recent-history prediction.

Connection options that use the same first train are shown as one journey. The option that arrives first remains visible. Other onward trains appear as alternatives on the second leg.

## Call graph

```mermaid
flowchart TD
    dashboard[TrainDashboard.vue]
    store[useTrainServicesStore]
    pipeline[getDashboardJourneys]
    active[getActiveSchedule]
    scheduled[getJourneyForSchedule]
    recent[getRecentJourneys]
    predicted[getPredictedJourney]
    selected[getActiveJourney]
    switcher[JourneySwitcher.vue]
    selectionStore[useJourneySelectionStore]
    routes[getStationRoutes]
    stations[getStationsForLocation]
    options[getRouteOptions]
    boards[getDepartureBoards]
    api[fetchDepartureBoard]
    trains[getTrainOptions]
    direct[getDirectTrainLegs]
    service[getTrainLeg]
    alternatives[combineAlternativeOnwardTrains]
    sections[makeTimetabledJourneys]
    catchable[getCatchableJourneys]
    sort[sortJourneysByArrival]
    recommended[markRecommendedJourney]
    missing[getRoutesWithoutTimetabledJourneys]
    timelines[JourneyTimelines.vue]
    cards[JourneyCards.vue]
    charts[JourneyCharts.vue]

    dashboard --> store
    store --> pipeline
    store --> selectionStore
    store --> active
    store --> predicted
    pipeline --> active
    pipeline --> predicted
    pipeline --> selected
    pipeline --> routes
    predicted --> scheduled
    predicted --> recent
    routes --> stations
    routes --> options

    pipeline --> boards
    boards --> api
    pipeline --> trains
    trains --> direct
    trains --> alternatives
    direct --> service
    pipeline --> sections
    pipeline --> catchable
    pipeline --> sort
    pipeline --> recommended

    dashboard --> switcher
    switcher --> store

    store --> missing
    dashboard --> timelines
    timelines -->|slice 0, 6| cards
    timelines -->|slice 0, 6| charts
```

## Source map

- `src/trainDashboard/store/trainServices.store.ts` coordinates each refresh.
- `src/trainDashboard/store/journeySelection.store.ts` keeps the temporary override and saves recent history.
- `src/trainDashboard/journeys/getDashboardJourneys.ts` shows the complete pipeline in order.
- `src/trainDashboard/journeys/planning/journeySelection.ts` selects recent, predicted, and active journeys.
- `src/trainDashboard/journeys/planning/journeyRoutes.ts` expands configured journeys into station routes.
- `src/trainDashboard/journeys/timetable/departureBoards.ts` creates and deduplicates departure-board requests.
- `src/trainDashboard/api/railDataMarketplace.api.ts` requests and validates departure boards.
- `src/trainDashboard/journeys/timetable/trainOptions.ts` finds direct trains and valid connections.
- `src/trainDashboard/journeys/timetable/timetabledJourneys.ts` builds sections, filters journeys, and sorts results.
- `src/trainDashboard/components/journeys/JourneySwitcher.vue` shows predicted, recent, and saved journeys without duplicates.
- `src/trainDashboard/components/journeys/JourneyTimelines.vue` limits the displayed journey list to six results.
