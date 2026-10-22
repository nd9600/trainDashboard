<template>
    <div
        v-if="waitingWorker"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 text-sm"
        role="status"
    >
        <span>A new version is available.</span>
        <button
            class="appButton appButton--primary px-3 py-1.5"
            type="button"
            :disabled="isUpdating"
            data-test="reload-app-update"
            @click="reloadToUpdate"
        >
            {{ isUpdating ? "Updating…" : "Update available — reload" }}
        </button>
    </div>
</template>

<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, shallowRef} from "vue";

const waitingWorker = shallowRef<ServiceWorker | null>(null);
const isUpdating = ref(false);
let registration: ServiceWorkerRegistration | undefined;
let installingWorker: ServiceWorker | null = null;
let isUnmounted = false;

onMounted(async () => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", reloadAfterUpdate);
    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);

    try {
        registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
            updateViaCache: "none",
        });
        if (isUnmounted) {
            return;
        }
        registration.addEventListener("updatefound", watchInstallingWorker);
        watchInstallingWorker();
        showWaitingUpdate();
    } catch (error) {
        console.warn("The service worker did not start.", error);
    }
});

function showWaitingUpdate(): void {
    // Do not show an update notice when the app is installed for the first time.
    if (navigator.serviceWorker.controller && registration?.waiting) {
        waitingWorker.value = registration.waiting;
    }
}

function watchInstallingWorker(): void {
    installingWorker?.removeEventListener("statechange", showWaitingUpdate);
    installingWorker = registration?.installing ?? null;
    installingWorker?.addEventListener("statechange", showWaitingUpdate);
}

function checkForUpdate(): void {
    registration?.update().catch(() => {
        // Keep using the app if the update check fails while offline.
    });
}

function reloadToUpdate(): void {
    if (!waitingWorker.value || isUpdating.value) {
        return;
    }

    isUpdating.value = true;
    if (waitingWorker.value.state === "installed") {
        waitingWorker.value.postMessage({type: "SKIP_WAITING"});
    } else {
        // Another tab may already have started this update.
        window.location.reload();
    }
}

function reloadAfterUpdate(): void {
    if (isUpdating.value) {
        window.location.reload();
    }
}

onBeforeUnmount(() => {
    isUnmounted = true;
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", reloadAfterUpdate);
    }
    window.removeEventListener("focus", checkForUpdate);
    window.removeEventListener("online", checkForUpdate);
    registration?.removeEventListener("updatefound", watchInstallingWorker);
    installingWorker?.removeEventListener("statechange", showWaitingUpdate);
});
</script>
