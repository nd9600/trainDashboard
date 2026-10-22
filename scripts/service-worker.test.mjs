import {runInNewContext} from "node:vm";
import {beforeEach, expect, it, vi} from "vitest";
import {createServiceWorker} from "./service-worker.mjs";

const scope = "https://example.test/trains/";
let handlers;
let savedResponses;
let fetchFromServer;
let skipWaiting;
let cache;

beforeEach(() => {
    handlers = new Map();
    savedResponses = new Map([[scope, new Response("Saved page")]]);
    fetchFromServer = vi.fn();
    skipWaiting = vi.fn().mockResolvedValue(undefined);
    cache = {
        addAll: vi.fn().mockResolvedValue(undefined),
        match: vi.fn(async (request) => savedResponses.get(getUrl(request))?.clone()),
        put: vi.fn(async (request, response) => savedResponses.set(getUrl(request), response)),
    };

    runInNewContext(createServiceWorker("train-dashboard-new", ["./", "./assets/app-new.js"]), {
        URL,
        fetch: fetchFromServer,
        caches: {open: async () => cache},
        self: {
            location: {origin: "https://example.test"},
            registration: {scope},
            addEventListener: (name, handler) => handlers.set(name, handler),
            skipWaiting,
        },
    });
});

it("loads fresh HTML and keeps it for offline navigation, including query strings", async () => {
    fetchFromServer.mockResolvedValueOnce(new Response("New page"));

    const freshResponse = await requestFromWorker("?journey=home", "navigate");
    fetchFromServer.mockRejectedValueOnce(new Error("Offline"));
    const offlineResponse = await requestFromWorker("?journey=work", "navigate");

    expect(await freshResponse.text()).toBe("New page");
    expect(await offlineResponse.text()).toBe("New page");
    expect(fetchFromServer).toHaveBeenCalledWith(
        expect.objectContaining({url: `${scope}?journey=home`}),
        {cache: "no-store"}
    );
});

it("keeps the saved page when the server returns an error", async () => {
    fetchFromServer.mockResolvedValueOnce(new Response("Unavailable", {status: 503}));

    const response = await requestFromWorker("", "navigate");

    expect(await response.text()).toBe("Saved page");
    expect(cache.put).not.toHaveBeenCalled();
});

it("stores new hashed assets and serves them without a network request next time", async () => {
    fetchFromServer.mockResolvedValueOnce(new Response("New script"));

    await requestFromWorker("assets/app-new.js");
    const cachedResponse = await requestFromWorker("assets/app-new.js");

    expect(await cachedResponse.text()).toBe("New script");
    expect(fetchFromServer).toHaveBeenCalledOnce();
});

it("does not cache data requests", async () => {
    fetchFromServer.mockResolvedValueOnce(new Response("Live data"));

    await requestFromWorker("api/departures");

    expect(cache.put).not.toHaveBeenCalled();
});

it("leaves external requests to the browser", () => {
    const respondWith = vi.fn();

    handlers.get("fetch")({
        request: {method: "GET", url: "https://api.example.test/departures"},
        respondWith,
    });

    expect(respondWith).not.toHaveBeenCalled();
});

it("waits for the update message before it skips waiting", async () => {
    const waitUntil = vi.fn();
    handlers.get("install")({waitUntil});
    await waitUntil.mock.calls[0][0];
    expect(cache.addAll).toHaveBeenCalledWith(["./", "./assets/app-new.js"]);
    expect(skipWaiting).not.toHaveBeenCalled();

    handlers.get("message")({data: {type: "SKIP_WAITING"}, waitUntil});

    expect(skipWaiting).toHaveBeenCalledOnce();
});

function getUrl(request) {
    return new URL(typeof request === "string" ? request : request.url, scope).href;
}

function requestFromWorker(path, mode = "cors") {
    const respondWith = vi.fn();
    handlers.get("fetch")({
        request: {method: "GET", url: new URL(path, scope).href, mode},
        respondWith,
    });
    return respondWith.mock.calls[0][0];
}
