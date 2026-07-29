<template>
    <section>
        <h2 class="text-lg font-semibold">API</h2>
        <p class="mt-1 text-sm text-[#687477]">
            API access is not connected yet. These fields show where the
            timetable credentials will go.
        </p>

        <fieldset
            class="mt-5 grid gap-4 rounded-lg border border-[#cbc8c0] bg-[#ebe8df] p-4 sm:grid-cols-2"
            disabled
        >
            <label>
                <span class="mb-1 block text-xs text-[#687477]">
                    API base URL
                </span>
                <input
                    class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 disabled:bg-[#dedbd3]"
                    placeholder="https://…"
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-[#687477]"> API key </span>
                <input
                    class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 disabled:bg-[#dedbd3]"
                    autocomplete="off"
                    placeholder="Not connected"
                    type="password"
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-[#687477]">
                    Client ID
                </span>
                <input
                    class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 disabled:bg-[#dedbd3]"
                    autocomplete="off"
                    placeholder="Not connected"
                />
            </label>
            <label>
                <span class="mb-1 block text-xs text-[#687477]">
                    Client secret
                </span>
                <input
                    class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 disabled:bg-[#dedbd3]"
                    autocomplete="new-password"
                    placeholder="Not connected"
                    type="password"
                />
            </label>
        </fieldset>
    </section>
</template>
