export function createServiceWorker(cacheName, cachedUrls) {
    return `const CACHE_PREFIX = "train-dashboard-";
const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHED_URLS = ${JSON.stringify(cachedUrls, null, 4)};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS))
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        event.waitUntil(self.skipWaiting());
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (
        event.request.method !== "GET"
        || new URL(event.request.url).origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(getResponse(event.request));
});

async function getResponse(request) {
    const cache = await caches.open(CACHE_NAME);

    if (request.mode === "navigate") {
        return getPage(request, cache);
    }

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(request);
    const assetsUrl = new URL("assets/", self.registration.scope).href;

    // A new page can refer to assets from a newer build. Store those assets for offline use.
    if (response.ok && request.url.startsWith(assetsUrl)) {
        await cache.put(request, response.clone());
    }

    return response;
}

async function getPage(request, cache) {
    let response;
    try {
        response = await fetch(request, {cache: "no-store"});
    } catch (error) {
        const cachedPage = await cache.match("./");
        if (cachedPage) {
            return cachedPage;
        }
        throw error;
    }

    if (response.ok) {
        await cache.put("./", response.clone());
        return response;
    }

    // Keep the saved page if the server returns an error.
    return (await cache.match("./")) ?? response;
}
`;
}
