import { defineStore } from "pinia";
import { ref } from "vue";

export const useUsuarioStore = defineStore("usuario", () => {
    // Definimos el email como reactivo
    const email = ref("");

    // Es OBLIGATORIO retornarlo para poder usarlo fuera
    return {
        email
    }
},
{ persist: true } // Esto hace la magia de guardar en localStorage
);