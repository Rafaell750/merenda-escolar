// /frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Importe o createPinia
import App from './App.vue'
import router from './router' // Seu roteador
import Toast from "vue-toastification"; // Importar
import "vue-toastification/dist/index.css"; // Importar CSS

const app = createApp(App)

const pinia = createPinia()     // 2. Crie a instância do Pinia
app.use(pinia)                  // 3. USE O PINIA <<< ESSENCIAL ANTES DO ROUTER

app.use(router)

// Configurações opcionais do Toast (pode ajustar)
const options = {
    position: "top-right",
    timeout: 4000, // 4 segundos
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false,
    transition: "Vue-Toastification__bounce", // Animação
    maxToasts: 5,
    newestOnTop: true
};

app.use(Toast, options); // Usar o plugin com as opções

app.mount('#app')