import {createApp} from "vue";
import {createPinia} from "pinia";
import TrainDashboard from "@/trainDashboard/components/TrainDashboard.vue";
import "./style.css";

createApp(TrainDashboard).use(createPinia()).mount("#app");

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register(`${import.meta.env.BASE_URL}sw.js`)
            .catch((error: unknown) => {
                console.warn("The service worker did not start.", error);
            });
    });
}
