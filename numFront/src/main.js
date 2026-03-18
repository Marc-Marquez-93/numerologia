import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from "./router/router.js"
import { Quasar, Dialog, Notify, Screen, LocalStorage, SessionStorage } from 'quasar'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'

import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const myApp = createApp(App)

myApp.use(Quasar, {
  plugins: {
    Dialog,
    Notify,
    Screen,
    LocalStorage,
    SessionStorage
  }, 
})

myApp.use(router)

myApp.use(pinia)

myApp.mount('#app')
