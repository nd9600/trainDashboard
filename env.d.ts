/// <reference types="vite/client" />

declare const __APP_BUILT_AT__: string;

declare module "*.csv?names" {
    const stationNames: Readonly<Record<string, string>>;
    export default stationNames;
}
