<template>
    <section aria-labelledby="api-settings-heading">
        <h2 id="api-settings-heading" class="text-lg font-semibold">API</h2>
        <p class="mt-1 text-sm text-ink-subtle">
            API access is not connected yet. These fields show where the
            timetable credentials will go.
        </p>

        <fieldset class="mt-5 grid gap-4 sm:grid-cols-2" disabled>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">
                    API base URL
                </span>
                <input class="appInput" placeholder="https://…" />
            </label>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">
                    API key
                </span>
                <input
                    class="appInput"
                    autocomplete="off"
                    placeholder="Not connected"
                    type="password"
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">
                    Client ID
                </span>
                <input
                    class="appInput"
                    autocomplete="off"
                    placeholder="Not connected"
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-ink-subtle">
                    Client secret
                </span>
                <input
                    class="appInput"
                    autocomplete="new-password"
                    placeholder="Not connected"
                    type="password"
                />
            </label>
        </fieldset>
    </section>
</template>
