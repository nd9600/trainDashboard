import {fileURLToPath, URL} from "node:url";

import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig(({mode}) => ({
    plugins: [vue(), vueDevTools(), tailwindcss()],
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
                            test: /[\\/]trainDashboard[\\/]stations[\\/]stationNames\.ts$/,
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
