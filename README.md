# Train Dashboard

Train Dashboard shows the train that you need to take for a saved journey.

## Project setup

```sh
npm install
```

### Start the development server

```sh
npm run dev
```

### Build for production

```sh
npm run build
```

The production build includes a web app manifest and a service worker. The service worker caches the application files. It does not cache live departure data.

### Deploy below a Zola site path

Set `VITE_BASE_PATH` to the public directory that will contain the application. The value must start and end with `/`.

For example, use this command if Zola serves the application from `/trains/`:

```sh
VITE_BASE_PATH=/trains/ npm run build
```

Copy the contents of `dist/` to `static/trains/` in the Zola project. Then build and deploy the Zola site.

The deployed site must use HTTPS. Serve `manifest.webmanifest` with the `application/manifest+json` content type.

The service worker scope matches `VITE_BASE_PATH`. It does not control other applications on the same domain.

Run the application once while it is online. The browser then stores the application files for later use.

### Run tests

```sh
npm test
```

### Run lint checks

```sh
npm run lint
```

## Code structure

The application has one active journey and one timetable pipeline.

| Responsibility | Location |
| --- | --- |
| Validated stored and API shapes | `src/trainDashboard/dto/` |
| Configuration, selection, clock, and request state | `src/trainDashboard/store/` |
| Pure prediction, identity, and choice rules | `src/trainDashboard/journeys/` |
| Route expansion | `src/trainDashboard/journeys/planning/` |
| Board requests and train planning | `src/trainDashboard/journeys/timetable/` |
| Shared endpoint editor | `src/trainDashboard/components/journeys/editing/` |
| Selection controls | `src/trainDashboard/components/journeys/switcher/` |
| Shared results, desktop charts, and mobile cards | `src/trainDashboard/components/journeys/timetables/` |
| Settings drafts and editors | `src/trainDashboard/components/settings/` |
| Shared controls and icon catalogue | `src/components/` |

See [selection](docs/journey-selection.md), [requests](docs/departure-boards.md), and [planning](docs/journey-planning.md) for diagrams and source maps.

`stations.csv` is the only station catalogue. The Vite `station-names` loader exports names and CRS codes from its unquoted columns.
The browser receives the generated lookup, not the CSV or its unused fields. The station lookup remains in a separate cacheable bundle.

The formatter uses a 100-character line width. Run `npm run format` after edits.
