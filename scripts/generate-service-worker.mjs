import {createHash} from "node:crypto";
import {readdir, readFile, writeFile} from "node:fs/promises";
import {createServiceWorker} from "./service-worker.mjs";

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

const serviceWorker = createServiceWorker(cacheName, cachedUrls);

await writeFile(new URL("sw.js", outputDirectory), serviceWorker);
