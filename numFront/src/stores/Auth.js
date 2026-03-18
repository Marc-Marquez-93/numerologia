import { defineStore } from "pinia";
import { ref } from "vue";


export const useAuthStore = defineStore("auth", () => {
    let token = ref("");

    return {
        token
    }
},

    { persist: true }
)
