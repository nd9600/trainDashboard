<template>
    <button type="button" :title="label" :aria-label="label">
        <AppIcon :name="icon" :class="iconClass" />
    </button>
</template>

<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type {IconName} from "./icons";
withDefaults(defineProps<{icon: IconName; label: string; iconClass?: string}>(), {
    iconClass: "size-4",
});
</script>
