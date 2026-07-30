<template>
    <TransitionRoot as="template" :show="isOpen">
        <Dialog
            class="relative z-50 text-base"
            @close="isClosable ? emit('close') : undefined"
        >
            <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-200 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
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
                    enter-from="translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
                    enter-to="translate-y-0 opacity-100 sm:scale-100"
                    leave="duration-200 ease-in"
                    leave-from="translate-y-0 opacity-100 sm:scale-100"
                    leave-to="translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
                >
                    <slot />
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup lang="ts">
import {Dialog, TransitionChild, TransitionRoot} from "@headlessui/vue";
import {computed} from "vue";

const props = withDefaults(
    defineProps<{
        isOpen: boolean;
        isClosable?: boolean;
        spotlightVariantPlacement?: "middle" | "top";
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
</script>
