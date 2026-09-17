/// <reference types="vite/client" />

declare module "*.csv?names" {
    const stationNames: Readonly<Record<string, string>>;
    export default stationNames;
}
