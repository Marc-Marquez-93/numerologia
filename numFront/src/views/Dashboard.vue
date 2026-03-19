<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useAuthStore } from '../stores/Auth.js';
import axiosInstance from '../plugins/axios.js';

import { setCssVar } from 'quasar';
const router = useRouter();
const $q = useQuasar();
const usuarioStore = useUsuarioStore();
const authStore = useAuthStore();

// Definir colores de marca
setCssVar('primary', '#13ec5b');
setCssVar('moss', '#2d4a34');

const tab = ref(router.currentRoute.value.path.includes('diaria') ? 'diaria' : 'principal');

const navigateTo = (route) => {
  if (route === 'principal') {
    router.push('/dashboard/lectura-principal');
  } else {
    router.push('/dashboard/lectura-diaria');
  }
};

const volverInicio = () => {
  $q.dialog({
    title: '¿Salir al Inicio?',
    message: '¿Estás seguro de salir de tu dashboard espiritual?',
    cancel: { flat: true, color: 'grey-7', noCaps: true, label: 'Cancelar' },
    persistent: true,
    ok: { color: 'primary', label: 'Sí, Salir', noCaps: true, textColor: 'dark', unelevated: true }
  }).onOk(() => {
    router.push("/");
  });
};

const cerrarSesion = () => {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Estás seguro de que deseas cerrar tu sesión actual?',
    cancel: { flat: true, color: 'grey-7', noCaps: true, label: 'Cancelar' },
    persistent: true,
    ok: { color: 'negative', label: 'Cerrar Sesión', noCaps: true, unelevated: true }
  }).onOk(() => {
    // Limpiamos ambas stores y redirigimos a login
    usuarioStore.$reset();
    authStore.token = '';
    router.push("/login");
  });
};

const eliminarUsuario = () => {
  $q.dialog({
    title: 'Eliminar Cuenta',
    message: '¿Seguro que quiere eliminar usuario? Perderá todas sus lecturas y pagos.',
    cancel: { flat: true, color: 'grey-7', label: 'Cancelar' },
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Eliminar',
      unelevated: true
    }
  }).onOk(async () => {
    try {
      if (usuarioStore.email) {
        await axiosInstance.delete(`/usuario/${usuarioStore.email}`);
        cerrarSesion();
      }
    } catch (err) {
      console.error("Error al eliminar el usuario", err);
      $q.notify({ type: 'negative', message: 'No se pudo eliminar el usuario.' });
    }
  });
};
</script>

<template>
  <div class="dashboard-container hide-scrollbar">
    <!-- Navbar global -->
    <nav class="fixed-top full-width q-pa-md flex justify-between items-center z-top bg-forest-dark custom-nav shadow-3">
      <div class="row items-center q-gutter-sm">
        <q-avatar color="primary" text-color="white" icon="auto_awesome" size="32px" class="shadow-3" />
        <span class="text-weight-bold tracking-tight text-subtitle1" style="color: white;">ALMA BELLA</span>
      </div>
      <div class="row items-center q-gutter-x-md">
        <!-- Avatar y Nombre del Usuario -->
        <div class="row items-center q-gutter-x-sm q-hide-xs">
          <span class="text-white text-weight-medium">{{ usuarioStore.nombre }}</span>
          <q-avatar color="primary" text-color="white" size="34px" class="shadow-2">
            {{ usuarioStore.nombre ? usuarioStore.nombre.charAt(0).toUpperCase() : 'U' }}
          </q-avatar>
        </div>

        <div class="row items-center q-gutter-x-xs">
          <q-btn flat round color="negative" icon="delete_forever" @click="eliminarUsuario" title="Eliminar cuenta">
            <q-tooltip>Eliminar cuenta definitivamente</q-tooltip>
          </q-btn>
          <q-btn flat round color="white" icon="home" @click="volverInicio" title="Inicio" />
          <q-btn flat round color="white" icon="logout" @click="cerrarSesion" title="Cerrar sesión" />
        </div>
      </div>
    </nav>

    <!-- Header / Selector de Vistas -->
    <div class="q-pt-xl q-mt-md flex flex-center full-width bg-transparent">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-7 custom-tabs q-mt-md"
        active-color="primary"
        indicator-color="primary"
        align="center"
        narrow-indicator
        @update:model-value="navigateTo"
        style="width: 100%; max-width: 600px;"
      >
        <q-tab name="principal" label="Lectura Principal" icon="auto_graph" class="q-px-lg font-tab" />
        <q-tab name="diaria" label="Lectura Diaria" icon="calendar_today" class="q-px-lg font-tab" />
      </q-tabs>
    </div>

    <!-- Contenido Dinámico (Lectura Principal o Lectura Diaria) -->
    <div class="dashboard-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f8f6f0; /* Fondo soft del proyecto */
  position: relative;
  overflow-x: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.custom-nav {
  /* Fondo con aspecto de cristal sobre forest dark */
  background: rgba(30, 60, 48, 0.95) !important;
  backdrop-filter: blur(8px);
}

.custom-tabs {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  padding: 4px;
}

.font-tab {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.dashboard-content {
  padding-top: 1rem;
  padding-bottom: 3rem;
  width: 100%;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Transición suave entre vistas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
