<template>
    <a
        class="inline-flex w-fit items-center gap-0.5 text-xs font-medium text-ink-subtle underline decoration-line-strong underline-offset-2 hover:text-primary"
        :href="nationalRailUrl(originCrs, destinationCrs, departureMinutes)"
        :aria-label="`${label} on National Rail Enquiries`"
        rel="noopener noreferrer"
        target="_blank"
    >
        {{ label }}
        <span aria-hidden="true">↗</span>
    </a>
</template>

<script setup lang="ts">
import {nationalRailUrl} from "../../presentation/journeyPresentation";

withDefaults(
    defineProps<{
        originCrs: string;
        destinationCrs: string;
        departureMinutes: number;
        label?: string;
    }>(),
    {
        label: "NRE",
    }
);
</script>
