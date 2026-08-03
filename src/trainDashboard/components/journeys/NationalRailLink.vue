<template>
    <a
        class="inline-flex w-fit items-center gap-0.5 text-xs font-medium text-ink-subtle underline decoration-line-strong underline-offset-2 hover:text-primary"
        :href="
            getNationalRailJourneyUrl(
                originCrs,
                destinationCrs,
                departureMinutes
            )
        "
        :aria-label="ariaLabel ?? `${label} on National Rail Enquiries`"
        rel="noopener noreferrer"
        target="_blank"
    >
        {{ label }}
        <AppIcon v-if="!isDesktop" class="size-3" name="external-link" />
    </a>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import {getNationalRailJourneyUrl} from "../../journeys/nationalRailUrls";

withDefaults(
    defineProps<{
        originCrs: string;
        destinationCrs: string;
        departureMinutes: number;
        label?: string;
        ariaLabel?: string;
        isDesktop?: boolean;
    }>(),
    {
        label: "NRE",
        isDesktop: false
    }
);
</script>
