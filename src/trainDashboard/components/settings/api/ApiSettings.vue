<template>
    <section aria-labelledby="api-settings-heading">
        <h2 id="api-settings-heading" class="text-lg font-semibold">
            <a
                class="underline"
                href="https://raildata.org.uk/"
            >
                Rail Data Marketplace
            </a>
        </h2>
        <p class="mt-1 text-sm text-ink-subtle">
            The dashboard sends your Consumer key in the
            <code>x-apikey</code> request header.
        </p>

        <label class="mt-5 block">
            <span class="mb-1 block text-xs text-ink-subtle">
                Consumer key
            </span>
            <span class="relative block">
                <input
                    ref="consumerKeyInput"
                    v-model="draft.consumerKey"
                    class="appInput pr-11"
                    autocomplete="off"
                    placeholder="Enter your Consumer key"
                    :type="isConsumerKeyVisible ? 'text' : 'password'"
                    @input="handleChange"
                />
                <button
                    class="appButton appButton--quiet px-0.5 py-0.5 absolute right-[5px] top-[5px]"
                    :class="
                        isConsumerKeyVisible
                            ? 'text-primary'
                            : 'text-ink-subtle'
                    "
                    type="button"
                    :aria-label="
                        isConsumerKeyVisible
                            ? 'Hide Consumer key'
                            : 'Show Consumer key'
                    "
                    :aria-pressed="isConsumerKeyVisible"
                    @click="isConsumerKeyVisible = !isConsumerKeyVisible"
                >
                    <AppIcon class="size-5" name="eye" />
                </button>
            </span>
        </label>

        <p class="mt-3 text-xs text-ink-subtle">
            Requests use
            <code
                >https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/</code
            >
        </p>
    </section>
</template>

<script setup lang="ts">
import {ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {RailDataApiSettings} from "../../../dto/railDataApiSettings.dto";
import {useRailDataApiStore} from "../../../store/railDataApi.store";

const apiStore = useRailDataApiStore();
const draft = ref<RailDataApiSettings>(cloneSettings(apiStore.settings));
const isConsumerKeyVisible = ref(false);
const consumerKeyInput = ref<HTMLInputElement | null>(null);
const hasUnsavedChanges = defineModel<boolean>("hasUnsavedChanges", {
    default: false,
});

function handleChange(): void {
    hasUnsavedChanges.value =
        draft.value.consumerKey !== apiStore.settings.consumerKey;
}

function save(): void {
    apiStore.saveSettings(draft.value);
    draft.value = cloneSettings(apiStore.settings);
    isConsumerKeyVisible.value = false;
    hasUnsavedChanges.value = false;
}

function cancel(): void {
    draft.value = cloneSettings(apiStore.settings);
    isConsumerKeyVisible.value = false;
    hasUnsavedChanges.value = false;
}

function cloneSettings(settings: RailDataApiSettings): RailDataApiSettings {
    return {...settings};
}

function focusConsumerKey(): void {
    consumerKeyInput.value?.focus();
}

defineExpose({
    cancel,
    focusConsumerKey,
    save,
});
</script>
