<template>
    <TransitionRoot as="template" :show="isOpen">
        <Dialog
            class="relative z-50 text-base"
            @close="isClosable ? emit('close') : undefined"
        >
            <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="duration-200 ease-in"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
            </TransitionChild>

            <div
                class="fixed inset-0 flex items-end justify-center sm:p-4"
                :class="placementClass"
            >
                <TransitionChild
                    as="template"
                    enter="duration-300 ease-out"
                    enterFrom="translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
                    enterTo="translate-y-0 opacity-100 sm:scale-100"
                    leave="duration-200 ease-in"
                    leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                    leaveTo="translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
                >
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
                            class="appButton appButton--quiet appButton--icon absolute top-3 right-3 z-10 size-10 rounded-full border-line-strong"
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
                            <DialogTitle
                                class="p-0 text-lg font-semibold text-ink"
                            >
                                <slot name="header" />
                            </DialogTitle>
                        </header>

                        <div
                            ref="body"
                            :class="
                                combineClasses(
                                    'min-h-0 grow overflow-y-auto',
                                    bodyClass
                                )
                            "
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
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup lang="ts">
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from "@headlessui/vue";
import {computed, onBeforeUnmount, ref, watch} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import {combineClasses, type ClassValue} from "@/utilities/ui.utility";

const props = withDefaults(
    defineProps<{
        isOpen: boolean;
        isClosable?: boolean;
        spotlightVariantPlacement?: "middle" | "top";
        rootClass?: ClassValue;
        bodyClass?: ClassValue;
        footerClass?: ClassValue;
    }>(),
    {
        isClosable: true,
        spotlightVariantPlacement: "middle",
    }
);

const emit = defineEmits<{
    close: [];
}>();

const placementClass = computed(() =>
    props.spotlightVariantPlacement === "top"
        ? "sm:items-start sm:pt-[5vh]"
        : "sm:items-center"
);

const body = ref<HTMLDivElement | null>(null);
const isBodyOverflowing = ref(false);
let resizeObserver: ResizeObserver | undefined;

watch(body, (element) => {
    resizeObserver?.disconnect();

    if (!element) {
        return;
    }

    resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) {
            return;
        }

        isBodyOverflowing.value =
            entry.target.scrollHeight > entry.target.clientHeight;
    });

    resizeObserver.observe(element);
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});
</script>
