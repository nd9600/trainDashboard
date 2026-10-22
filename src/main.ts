import {createApp} from "vue";
import {createPinia} from "pinia";
import TrainDashboard from "@/trainDashboard/components/TrainDashboard.vue";
import "./style.css";

createApp(TrainDashboard).use(createPinia()).mount("#app");
