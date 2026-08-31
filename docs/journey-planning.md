# Journey planning

The dashboard converts the current time and saved settings into journeys that a passenger can catch.

```text
Current time
      ↓
Active schedule
      ↓
Scheduled journey ID
      ↓
Predicted journey ID
      ↓
Active selection: predicted, saved ID, or current ephemeral journey
      ↓
Resolved active journey
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
    participant Selection as journeySelection store
    participant Clock as dashboardClock store
    participant Store as trainServices store
    participant Config as dashboardConfig store
    participant Pipeline as getDashboardJourneys
    participant Boards as Departure-board stage
    participant API as Rail Data Marketplace

    Store->>Selection: initialise()
    Selection->>Selection: Load recent journey IDs and ephemeral journeys
    Selection->>Config: Read schedules and journeys
    Selection->>Clock: Read the current clock
    Selection->>Selection: Compute schedule and predicted journey ID
    Selection->>Selection: Resolve the active selection to one Journey
    Store->>Selection: Read the resolved active journey
    Store->>Config: Read station groups
    Store->>Clock: Read the current clock
    Store->>Pipeline: getDashboardJourneys(journey, stationGroups, currentClock, consumerKey)
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
    alt Select an existing journey
        UI->>Switcher: Select a journey
        Switcher->>Selection: selectJourney(journeyId)
    else Select a station-to-station journey
        UI->>Switcher: Choose Go somewhere else
        Switcher->>Switcher: Select two stations and an optional connection
        Switcher->>Selection: selectEphemeralJourney(fields)
    end
    Selection->>Selection: Set the active selection and update recent IDs
    Selection-->>Store: Resolved active journey changed
    Store->>Pipeline: Refresh the active journey

    opt Save a station-to-station journey
        UI->>Switcher: Select Save
        Switcher->>Selection: saveActiveJourney()
        Selection->>Config: saveJourney(journey)
        Selection->>Selection: Remove the journey from ephemeral memory
    end

    opt Clear a station-to-station journey
        UI->>Switcher: Select Clear
        Switcher->>Selection: clearActiveJourney()
        Selection-->>Store: Restore the current predicted journey
        Store->>Pipeline: Refresh the active journey
    end

    opt Remove a journey choice
        UI->>Switcher: Select x
        alt Recent journey
            Switcher->>Selection: removeRecentJourney(journeyId)
            Selection->>Selection: Remove the journey ID from history
        else Unscheduled saved journey
            Switcher->>Selection: removeSavedJourney(journeyId)
            Selection->>Config: removeJourney(journeyId)
        end
    end

    opt Edit an unscheduled active journey
        UI->>Switcher: Select Edit
        Switcher->>Selection: editActiveJourney(fields)
        alt Ephemeral journey
            Selection->>Selection: Update ephemeral journey memory
        else Saved journey
            Selection->>Config: updateJourney(journey)
        end
        Selection-->>Store: Resolved active journey changed
    end
```

A station-pair request occurs only once during each planning request.

A matching schedule supplies the predicted journey. If no schedule matches, there is no predicted journey.

Recent history does not affect prediction. A new selection remains a temporary override during that page session.

The selection store starts with explicit empty state. The train-services store calls `initialise()` before its first refresh. The action loads memory once.

The selection immediately appears in the Recent section. A page refresh restores the current schedule prediction.

Saved and ephemeral journeys use the same `Journey` shape. An ephemeral journey uses station endpoints and can include one connecting station.

The Save action adds the same journey to the configuration. Its ID stays the same unless that ID is already in use.

Recent history contains journey IDs only. Ephemeral journey definitions remain in journey memory while a recent or active selection refers to them.

Removing a recent journey only removes its history entry. A saved journey can be removed or edited only when no schedule uses it.

The Clear action restores the current schedule prediction. It does not add another recent-history entry.

Connection options that use the same first train are shown as one journey. The option that arrives first remains visible. Other onward trains appear as alternatives on the second leg.

## Call graph

```mermaid
flowchart TD
    dashboard[TrainDashboard.vue]
    header[DashboardHeader.vue]
    store[useTrainServicesStore]
    pipeline[getDashboardJourneys]
    prediction[getJourneyPrediction]
    switcher[JourneySwitcher.vue]
    journeyForm[JourneyForm.vue]
    maker[JourneyMaker.vue]
    selectionStore[useJourneySelectionStore]
    clockStore[useDashboardClockStore]
    configStore[useDashboardConfigStore]
    createEphemeral[createEphemeralJourney]
    stationInput[StationInput.vue]
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
    store --> configStore
    store --> clockStore
    selectionStore --> prediction
    selectionStore --> configStore
    selectionStore --> clockStore
    pipeline --> routes
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

    dashboard --> header
    dashboard --> switcher
    dashboard --> clockStore
    header --> switcher
    switcher --> selectionStore
    switcher --> configStore
    switcher --> journeyForm
    journeyForm --> maker
    maker --> stationInput
    selectionStore --> createEphemeral

    dashboard --> missing
    dashboard --> timelines
    timelines -->|slice 0, 6| cards
    timelines -->|slice 0, 6| charts
```

## Source map

- `src/trainDashboard/store/trainServices.store.ts` initialises journey selection and refreshes train data for the resolved active journey.
- `src/trainDashboard/store/journeySelection.store.ts` owns selection state, memory, choices, and journey actions.
- `src/trainDashboard/store/dashboardClock.store.ts` owns the current dashboard clock and minute timer.
- `src/trainDashboard/store/dashboardConfig.store.ts` saves, updates, and removes journeys in the configuration.
- `src/trainDashboard/dto/journeySelection.dto.ts` defines active selection and journey-memory shapes.
- `src/trainDashboard/journeys/journeyPrediction.ts` selects the active schedule and predicted journey ID.
- `src/trainDashboard/journeys/getDashboardJourneys.ts` shows the complete pipeline in order.
- `src/trainDashboard/journeys/planning/journeyRoutes.ts` expands journeys into station routes.
- `src/trainDashboard/journeys/timetable/departureBoards.ts` creates and deduplicates departure-board requests.
- `src/trainDashboard/api/railDataMarketplace.api.ts` requests and validates departure boards.
- `src/trainDashboard/journeys/timetable/trainOptions.ts` finds direct trains and valid connections.
- `src/trainDashboard/journeys/timetable/timetabledJourneys.ts` builds sections, filters journeys, and sorts results.
- `src/trainDashboard/components/TrainDashboard.vue` shows the journey switcher when there is no resolved active journey.
- `src/trainDashboard/components/DashboardHeader.vue` shows the compact journey switcher when an active journey exists.
- `src/trainDashboard/components/journeys/JourneySwitcher.vue` selects, edits, and removes eligible journey choices.
- `src/trainDashboard/components/journeys/JourneyForm.vue` owns new and edited journey drafts and their submit and Cancel actions.
- `src/trainDashboard/components/journeys/JourneyMaker.vue` builds configured and ephemeral journeys from endpoints and an optional connection.
- `src/trainDashboard/components/settings/stationGroups/StationInput.vue` selects stations for journey endpoints and connections.
- `src/trainDashboard/components/journeys/JourneyTimelines.vue` limits the displayed journey list to six results.
