<template>
    <section aria-labelledby="api-settings-heading">
        <h2 id="api-settings-heading" class="text-lg font-semibold">
            <a class="underline" href="https://raildata.org.uk/"> Rail Data Marketplace </a>
        </h2>
        <p class="mt-1 text-sm text-ink-subtle">
            The dashboard sends your Consumer key in the
            <code>x-apikey</code> request header.
        </p>

        <label class="mt-5 block">
            <span class="mb-1 block text-xs text-ink-subtle"> Consumer key </span>
            <span class="relative block">
                <input
                    ref="consumerKeyInputRef"
                    v-model="draft.consumerKey"
                    class="appInput pr-11"
                    autocomplete="off"
                    pattern="[A-Za-z0-9]*"
                    :aria-invalid="!!error"
                    :aria-describedby="error ? 'consumer-key-error' : undefined"
                    placeholder="Enter your Consumer key"
                    :type="isConsumerKeyVisible ? 'text' : 'password'"
                    @input="handleChange"
                />
                <AppIconButton
                    class="appButton appButton--quiet px-0.5 py-0.5 absolute right-[5px] top-[5px]"
                    :class="isConsumerKeyVisible ? 'text-primary' : 'text-ink-subtle'"
                    :aria-pressed="isConsumerKeyVisible"
                    @click="isConsumerKeyVisible = !isConsumerKeyVisible"
                    :label="isConsumerKeyVisible ? 'Hide Consumer key' : 'Show Consumer key'"
                    icon="eye"
                    iconClass="size-5"
                />
            </span>
        </label>
        <p v-if="error" id="consumer-key-error" class="mt-2 text-sm text-danger-dark" role="alert">
            {{ error }}
        </p>

        <p class="mt-3 text-xs text-ink-subtle">
            Requests use
            <code
                >https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/</code
            >
        </p>
    </section>
</template>

<script setup lang="ts">
import AppIconButton from "@/components/AppIconButton.vue";
import {computed, ref, watch} from "vue";
import {
    RailDataApiSettingsSchema,
    type RailDataApiSettings,
} from "../../../dto/railDataApiSettings.dto";
import {useRailDataApiStore} from "../../../store/railDataApi.store";

const railDataApiStore = useRailDataApiStore();
const draft = ref<RailDataApiSettings>({...railDataApiStore.settings});
const isConsumerKeyVisible = ref(false);
const consumerKeyInputRef = ref<HTMLInputElement | null>(null);
const hasUnsavedChanges = defineModel<boolean>("hasUnsavedChanges", {
    default: false,
});
const emit = defineEmits<{validChange: [isValid: boolean]}>();
const error = computed(() => {
    const result = RailDataApiSettingsSchema.safeParse(draft.value);
    return result.success ? undefined : result.error.issues[0]?.message;
});

watch(error, (message) => emit("validChange", !message), {immediate: true});

function handleChange(): void {
    hasUnsavedChanges.value = draft.value.consumerKey !== railDataApiStore.settings.consumerKey;
}

function save(): void {
    if (error.value) {
        return;
    }

    railDataApiStore.saveApiSettings(draft.value);
    draft.value = {...railDataApiStore.settings};
    isConsumerKeyVisible.value = false;
    hasUnsavedChanges.value = false;
}

function cancel(): void {
    draft.value = {...railDataApiStore.settings};
    isConsumerKeyVisible.value = false;
    hasUnsavedChanges.value = false;
}

function focusConsumerKey(): void {
    consumerKeyInputRef.value?.focus();
}

defineExpose({
    cancel,
    focusConsumerKey,
    save,
});
</script>
