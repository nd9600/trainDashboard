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
