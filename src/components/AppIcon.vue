<template>
    <svg
        class="shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <template v-if="name === 'clock'">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </template>

        <template v-else-if="name === 'chevron'">
            <path d="m9 5 7 7-7 7" />
        </template>

        <template v-else-if="name === 'close'">
            <path d="M6 6l12 12M18 6 6 18" />
        </template>

        <template v-else-if="name === 'train'">
            <rect x="5" y="3" width="14" height="16" rx="3" />
            <path d="M8 7h8M8 11h8M8 19l-2 2M16 19l2 2" />
            <circle cx="9" cy="15" r="1" />
            <circle cx="15" cy="15" r="1" />
        </template>

        <template v-else-if="name === 'home'">
            <path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
        </template>

        <template v-else-if="name === 'briefcase'">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
        </template>

        <template v-else-if="name === 'settings'">
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"
            />
        </template>

        <template v-else-if="name === 'key'">
            <circle cx="8" cy="15" r="4" />
            <path d="m11 12 8-8M15 8l2 2M17 6l2 2" />
        </template>

        <template v-else-if="name === 'external-link'">
            <path
                d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
            />
        </template>

        <template v-else-if="name === 'eye'">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </template>

        <template v-else-if="name === 'map-pin'">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </template>

        <template v-else-if="name === 'plus'">
            <path d="M12 5v14M5 12h14" />
        </template>

        <template v-else-if="name === 'trash'">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
        </template>

        <template v-else-if="name === 'walk'">
            <circle cx="13" cy="4" r="2" />
            <path d="m10 21 2-7-3-3 2-4 4 3 3 1M12 14l4 3 1 4M9 11l-4 2" />
        </template>
    </svg>
</template>

<script setup lang="ts">
defineProps<{
    name:
        | "briefcase"
        | "chevron"
        | "close"
        | "clock"
        | "eye"
        | "external-link"
        | "home"
        | "key"
        | "map-pin"
        | "plus"
        | "settings"
        | "train"
        | "trash"
        | "walk";
}>();
</script>
