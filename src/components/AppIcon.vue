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
        <component
            v-for="(shape, index) in icons[name]"
            :key="index"
            :is="shape.tag"
            v-bind="shape.attrs"
        />
    </svg>
</template>

<script setup lang="ts">
import {icons, type IconName} from "./icons";
defineProps<{name: IconName}>();
</script>
