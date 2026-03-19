<script setup>
import { ref, onMounted } from 'vue';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useNotifications } from '../composables/useNotify.js';
import axiosInstance from "../plugins/axios.js";
import { useFormatLectura } from '../composables/useFormatLectura.js';

const usuarioStore = useUsuarioStore();
const { error } = useNotifications();
const { formatearTextoIA } = useFormatLectura();

const contenidoIA = ref('');
const cargando = ref(true);

const obtenerLecturaPrincipal = async () => {
    try {
        const res = await axiosInstance.get(`/lectura/usuario/${usuarioStore.email}`);
        const lecturas = res.data.lecturas || [];
        
        // Asume que la lectura principal es la primera (o se filtra por un tipo si existe)
        const principal = lecturas.length > 0 ? lecturas[0] : null;

        if (principal) {
            contenidoIA.value = formatearTextoIA(principal.contenido);
        } else {
            contenidoIA.value = "Parece que aún no tienes una lectura principal generada.";
        }
    } catch(err) {
        error('Aviso', 'Error al sincronizar tu lectura principal.');
    } finally {
        cargando.value = false;
    }
}

onMounted(() => {
    if(usuarioStore.email) {
        obtenerLecturaPrincipal();
    } else {
        cargando.value = false;
        contenidoIA.value = "Inicia sesión para ver tu mensaje.";
    }
});
</script>

<template>
  <div class="lectura-container q-pa-md flex column items-center" style="min-height: 80vh">
    <div v-if="cargando" class="flex flex-center full-height full-width">
        <q-spinner-hourglass color="primary" size="4em" />
        <span class="q-ml-md text-moss">Contactando a los astros...</span>
    </div>

    <div v-else class="full-width max-width q-mt-md" style="max-width: 800px;">
        <div class="row justify-center q-mb-lg">
          <div class="bg-primary opacity-3" style="width: 64px; height: 4px; border-radius: 4px"></div>
        </div>

        <div class="lectura-card-wrapper q-mb-xl relative-position group">
          <q-icon name="eco" size="3rem" class="text-moss ornament-leaf leaf-top-left" />
          <q-icon name="eco" size="3rem" class="text-moss ornament-leaf leaf-bottom-right" />

          <div class="q-pa-lg md:q-pa-xl text-center relative-position">
            <div class="q-mb-lg">
              <p class="text-caption text-weight-bold text-primary text-uppercase tracking-widest q-mb-sm">
                Mensaje de los Astros
              </p>
              <h1 class="text-h4 text-weight-bold text-moss" style="line-height: 1.2">
                Tu Lectura Principal
              </h1>
            </div>

            <div class="q-mx-auto bg-moss-light q-pa-md border-radius-lg fuente-mistica text-moss"
              style="max-width: 650px; text-align: left; white-space: pre-line;" v-html="contenidoIA">
            </div>

            <div class="row items-center justify-center q-gutter-x-md q-py-md q-mt-md">
              <div class="bg-grey-4" style="height: 1px; width: 48px"></div>
              <q-icon name="stars" color="primary" size="sm" />
              <div class="bg-grey-4" style="height: 1px; width: 48px"></div>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/lecturaPrincipal.css';
</style>
