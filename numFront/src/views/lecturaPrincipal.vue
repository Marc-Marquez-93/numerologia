<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { postData } from '../services/apiCliente.js';
import { useNotifications } from '../composables/useNotify.js';
import { useUsuarioStore } from '../stores/Usuario.js';
// 1. Importamos el nuevo composable
import { useFormatLectura } from '../composables/useFormatLectura.js';

const router = useRouter();
const { success, error } = useNotifications();
const usuarioStore = useUsuarioStore();
// 2. Instanciamos el formateador
const { formatearTextoIA } = useFormatLectura();

const lecturaGenerada = ref(false);
const cargando = ref(false);
const contenidoIA = ref('');

const generarLectura = async () => {
  if (!usuarioStore.email) {
    error('Error de sesión', 'No pudimos encontrar tu usuario.');
    router.push('/login');
    return;
  }

  try {
    cargando.value = true;
    const url = `/lectura/principal/${usuarioStore.email}`;

    const res = await postData(url, {});

    // 3. AQUÍ FORMATEAMOS EL TEXTO ANTES DE GUARDARLO
    const textoCrudo = res.nuevaLectura.contenido;
    contenidoIA.value = formatearTextoIA(textoCrudo);

    success('¡Destino revelado!', res.msg);
    lecturaGenerada.value = true;

  } catch (err) {
    console.log(err);
    const mensajeError = err.response?.data?.msg || 'Las estrellas están nubladas. Intenta más tarde.';
    error('Aviso', mensajeError);
  } finally {
    cargando.value = false;
  }
};

const activarMensajeDiario = async () => {
  console.log("Botón de mensaje diario presionado");
  router.push('/login');
};

const volverInicio = () => {
  router.push("/");
};
</script>

<template>
  <div class="lectura-container ornament-pattern flex column items-center q-pa-md md:q-pa-xl">
    <nav class="fixed-top full-width q-pa-md flex justify-between items-center z-top bg-transparent">
      <div class="row items-center q-gutter-sm cursor-pointer" @click="volverInicio">
        <q-avatar color="primary" text-color="white" icon="auto_awesome" size="32px" class="shadow-3" />
        <span class="text-weight-bold text-moss tracking-tight text-subtitle1">ALMA BELLA</span>
      </div>
    </nav>

    <main class="full-width max-width q-mt-xl q-mb-xl flex flex-center" style="max-width: 900px; min-height: 80vh">
      <div v-if="!lecturaGenerada" class="text-center column items-center justify-center">
        <q-icon name="auto_graph" size="6rem" color="primary" class="q-mb-md opacity-8" />
        <h2 class="text-h4 text-weight-bold text-moss q-mb-lg">
          Tus números, tu destino:
        </h2>
        <p class="text-body1 text-earth opacity-8 q-mb-xl" style="max-width: 500px">
         Descubre que tiene el mundo para contarte, tu vibra no miente, escuchala dando click en el botón
        </p>

        <q-btn @click="generarLectura" :loading="cargando" color="primary" text-color="dark"
          label="Descubrir mi vibra" icon-right="stars" size="xl" rounded unelevated
          class="text-weight-bold shadow-soft hover-scale q-px-xl py-sm" no-caps>
          <template v-slot:loading>
            <q-spinner-hourglass class="on-left" />
            Canalizando energía...
          </template>
        </q-btn>
      </div>

      <div v-else class="full-width">
        <div class="row justify-center q-mb-lg">
          <div class="bg-primary opacity-3" style="width: 64px; height: 4px; border-radius: 4px"></div>
        </div>

        <div class="lectura-card-wrapper q-mb-xl relative-position group">
          <q-icon name="eco" size="3rem" class="text-moss ornament-leaf leaf-top-left" />
          <q-icon name="eco" size="3rem" class="text-moss ornament-leaf leaf-bottom-right" />

          <div class="q-pa-lg md:q-pa-xl text-center relative-position z-top">
            <div class="q-mb-lg">
              <p class="text-caption text-weight-bold text-primary text-uppercase tracking-widest q-mb-sm">
                Mensaje de los Astros
              </p>
              <h1 class="text-h4 text-weight-bold text-moss" style="line-height: 1.2">
                Te presentamos tu lectura
              </h1>
            </div>

            <div class="q-mx-auto bg-moss-light q-pa-md border-radius-lg fuente-mistica"
              style="max-width: 650px; text-align: left; white-space: pre-line;" v-html="contenidoIA">
            </div>

            <div class="row items-center justify-center q-gutter-x-md q-py-md q-mt-md">
              <div class="bg-grey-4" style="height: 1px; width: 48px"></div>
              <q-icon name="stars" color="primary" size="sm" />
              <div class="bg-grey-4" style="height: 1px; width: 48px"></div>
            </div>
          </div>
        </div>

        <div class="text-center q-px-md q-mt-xl">
          <div class="q-mx-auto" style="max-width: 450px">
            <p class="text-h6 text-moss text-weight-medium q-mb-lg" style="line-height: 1.5">
              Si quieres saber más de ti, puedes recibir tu mensaje espiritual
              diario :)
            </p>
          </div>

          <div class="column items-center q-gutter-y-lg">
            <div class="column items-center q-gutter-y-sm">
              <q-btn @click="activarMensajeDiario" color="primary" text-color="dark" label="Activar Mensaje Diario"
                icon="notifications_active" size="lg" rounded unelevated
                class="text-weight-bold shadow-4 hover-scale q-px-xl q-py-md" no-caps />
              <p class="text-caption text-grey-6 text-uppercase text-weight-medium q-mt-sm tracking-widest"
                style="font-size: 10px">
                Suscripción Premium • Cancela cuando quieras
              </p>
            </div>
            <span @click="router.push('/login')" class="cursor-pointer text-earth opacity-6 hover-primary text-caption text-weight-medium" style="
                text-decoration: underline;
                text-underline-offset: 4px;
                transition: color 0.3s;
              ">
              Continuar como principiante
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import '../styles/lecturaPrincipal.css';
</style>