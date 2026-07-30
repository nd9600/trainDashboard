<template>
    <DialogPanel
        :class="
            combineClasses(
                'relative flex max-h-[90dvh] w-full flex-col rounded-t-xl bg-canvas shadow-xl sm:max-h-full sm:rounded-xl',
                rootClass
            )
        "
    >
        <button
            v-if="isClosable"
            class="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-line-strong text-ink-muted hover:bg-surface-muted"
            type="button"
            aria-label="Close settings"
            @click="emit('close')"
        >
            <AppIcon class="size-5" name="close" />
        </button>

        <header
            v-if="$slots.header"
            class="border-b border-line px-5 py-4 pr-14"
        >
            <DialogTitle class="p-0 text-lg font-semibold text-ink">
                <slot name="header" />
            </DialogTitle>
        </header>

        <div
            ref="body"
            :class="combineClasses('min-h-0 grow overflow-y-auto', bodyClass)"
            :tabindex="isBodyOverflowing ? 0 : -1"
            role="region"
        >
            <slot />
        </div>

        <footer v-if="$slots.footer" class="shrink-0 bg-canvas">
            <div
                :class="
                    combineClasses(
                        'border-t border-line px-5 py-4',
                        footerClass
                    )
                "
            >
                <slot name="footer" />
            </div>
        </footer>
    </DialogPanel>
</template>

<script setup lang="ts">
import {DialogPanel, DialogTitle} from "@headlessui/vue";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {combineClasses, type ClassValue} from "@/ui.utilities.ts";
import AppIcon from "../AppIcon.vue";

const {
    isClosable = true,
    rootClass,
    bodyClass,
    footerClass,
} = defineProps<{
    isClosable?: boolean;
    rootClass?: ClassValue;
    bodyClass?: ClassValue;
    footerClass?: ClassValue;
}>();

const emit = defineEmits<{
    close: [];
}>();

const body = ref<HTMLDivElement | null>(null);
const isBodyOverflowing = ref(false);
let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
    resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) {
            return;
        }

        isBodyOverflowing.value =
            entry.target.scrollHeight > entry.target.clientHeight;
    });

    if (body.value) {
        resizeObserver.observe(body.value);
    }
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});
</script>
