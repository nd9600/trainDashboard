import {createHash} from "node:crypto";
import {readdir, readFile, writeFile} from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);

async function getFilePaths(directory, parentPath = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    const paths = [];

    for (const entry of entries) {
        const path = `${parentPath}${entry.name}`;

        if (entry.isDirectory()) {
            paths.push(
                ...(await getFilePaths(new URL(`${entry.name}/`, directory), `${path}/`))
            );
        } else if (entry.name !== "sw.js" && !entry.name.endsWith(".map")) {
            paths.push(path);
        }
    }

    return paths;
}

const filePaths = (await getFilePaths(outputDirectory)).sort();
const buildHash = createHash("sha256");

for (const filePath of filePaths) {
    buildHash.update(filePath);
    buildHash.update(await readFile(new URL(filePath, outputDirectory)));
}

const cacheName = `train-dashboard-${buildHash.digest("hex").slice(0, 16)}`;
const cachedUrls = filePaths.map((filePath) =>
    filePath === "index.html" ? "./" : `./${filePath}`
);

const serviceWorker = `const CACHE_PREFIX = "train-dashboard-";
const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHED_URLS = ${JSON.stringify(cachedUrls, null, 4)};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter(
                            (cacheName) =>
                                cacheName.startsWith(CACHE_PREFIX) &&
                                cacheName !== CACHE_NAME
                        )
                        .map((cacheName) => caches.delete(cacheName))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (
        event.request.method !== "GET" ||
        new URL(event.request.url).origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request, {
                ignoreSearch: event.request.mode === "navigate",
            });

            if (cachedResponse) return cachedResponse;

            try {
                return await fetch(event.request);
            } catch (error) {
                if (event.request.mode === "navigate") {
                    const application = await cache.match("./");
                    if (application) return application;
                }

                throw error;
            }
        })
    );
});
`;

await writeFile(new URL("sw.js", outputDirectory), serviceWorker);
