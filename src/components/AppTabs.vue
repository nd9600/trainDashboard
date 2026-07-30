<template>
    <div
        class="overflow-x-auto"
        :class="
            variant === 'card'
                ? 'grid grid-cols-2 gap-2 sm:flex'
                : 'flex border-b border-line'
        "
        role="tablist"
    >
        <button
            v-for="tab in tabs"
            :id="`${idPrefix}-tab-${tab.value}`"
            :key="tab.value"
            class="inline-flex grow items-center justify-center px-2 py-2 text-sm font-semibold transition-colors sm:px-4"
            :class="tabClass(tab.value)"
            type="button"
            role="tab"
            :aria-controls="`${idPrefix}-panel-${tab.value}`"
            :aria-selected="modelValue === tab.value"
            @click="emit('update:modelValue', tab.value)"
        >
            <AppIcon
                v-if="tab.icon"
                class="mr-2 inline-block size-4 align-text-bottom"
                :name="tab.icon"
            />
            <span>{{ tab.label }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

type TabIcon = "clock" | "key" | "map-pin" | "train" | "walk";

const props = withDefaults(
    defineProps<{
        idPrefix: string;
        modelValue: string;
        tabs: Array<{label: string; value: string; icon?: TabIcon}>;
        variant?: "card" | "line";
    }>(),
    {
        variant: "line",
    }
);

const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

function tabClass(value: string): string {
    if (props.variant === "card") {
        return props.modelValue === value
            ? "min-w-0 rounded-lg border border-primary bg-primary py-3 text-paper shadow-sm"
            : "min-w-0 rounded-lg border border-line bg-paper py-3 text-ink-muted hover:border-line-strong hover:bg-surface-muted";
    }

    return props.modelValue === value
        ? "min-w-max border-b-2 border-primary text-primary"
        : "min-w-max text-ink-subtle hover:bg-surface hover:text-ink-muted";
}
</script>
