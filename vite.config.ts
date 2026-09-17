import {fileURLToPath, URL} from "node:url";
import {readFileSync} from "node:fs";

import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";

const basePath = process.env.VITE_BASE_PATH ?? "/";

if (!basePath.startsWith("/") || !basePath.endsWith("/")) {
    throw new Error("VITE_BASE_PATH must start and end with `/`.");
}

export default defineConfig(({mode}) => ({
    base: basePath,
    plugins: [
        vue(),
        tailwindcss(),
        {
            name: "station-names",
            enforce: "pre",
            load(id) {
                if (!id.endsWith("/stations.csv?names")) return;
                const file = id.slice(0, -"?names".length);
                this.addWatchFile(file);
                // The catalogue has unquoted fields. Only names and codes enter the browser bundle.
                const rows = readFileSync(file, "utf8").trim().split(/\r?\n/).slice(1);
                const names = Object.fromEntries(
                    rows.map((row) => {
                        const [name, , , code] = row.split(",");
                        return [code, name];
                    })
                );
                return `export default ${JSON.stringify(names)}`;
            },
        },
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        minify: mode === "production" ? "oxc" : false,
        sourcemap: mode === "production",
        rolldownOptions: {
            output: {
                entryFileNames: "assets/js/[name]-[hash].js",
                chunkFileNames: "assets/js/[name]-[hash].js",
                codeSplitting: {
                    groups: [
                        {
                            name: "station-data",
                            test: /(?:stationNames\.ts|stations\.csv\?names)$/,
                        },
                        {
                            name: "vue-vendor",
                            test: /node_modules[\\/](?:@vue|vue|pinia)[\\/]/,
                        },
                        {
                            name: "vendor",
                            test: /node_modules[\\/]/,
                        },
                    ],
                },
            },
        },
    },
}));
