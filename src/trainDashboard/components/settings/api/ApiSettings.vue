<template>
    <section aria-labelledby="api-settings-heading">
        <h2 id="api-settings-heading" class="text-lg font-semibold">
            Rail Data Marketplace
        </h2>
        <p class="mt-1 text-sm text-ink-subtle">
            The dashboard sends your Consumer key in the
            <code>x-apikey</code> request header.
        </p>

        <label class="mt-5 block">
            <span class="mb-1 block text-xs text-ink-subtle">
                Consumer key
            </span>
            <input
                v-model="draft.consumerKey"
                class="appInput"
                autocomplete="off"
                placeholder="Enter your Consumer key"
                type="password"
                @input="handleChange"
            />
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
import type {RailDataApiSettings} from "../../../dto/railDataApiSettings.dto";
import {useRailDataApiStore} from "../../../store/railDataApi.store";

const apiStore = useRailDataApiStore();
const draft = ref<RailDataApiSettings>(cloneSettings(apiStore.settings));
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
    hasUnsavedChanges.value = false;
}

function cancel(): void {
    draft.value = cloneSettings(apiStore.settings);
    hasUnsavedChanges.value = false;
}

function cloneSettings(settings: RailDataApiSettings): RailDataApiSettings {
    return {...settings};
}

defineExpose({
    cancel,
    save,
});
</script>
