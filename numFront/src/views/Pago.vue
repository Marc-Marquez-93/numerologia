<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotify.js';
import axiosInstance from '../plugins/axios.js';
import { useUsuarioStore } from '../stores/Usuario.js';

const router = useRouter();
const { success, error } = useNotifications();
const usuarioStore = useUsuarioStore();

const cargando = ref(false);
const metodoPago = ref(0); // 0 = Tarjeta, 1 o 2 otros métodos según tu base de datos.
const emailForm = ref(usuarioStore.email || '');

const procesarPago = async () => {
    if (!emailForm.value) {
        return error("Correo requerido", "Por favor ingresa tu correo para el pago.");
    }
    
    try {
        cargando.value = true;
        
        const payload = {
            usuario_email: emailForm.value
        };

        const res = await axiosInstance.post('/pago/create-preference', payload);
        
        if (res.data.init_point) {
            // Redirigir al checkout de Mercado Pago
            window.location.href = res.data.init_point;
        } else {
            error("Error de pago", "No se pudo generar el enlace de pago.");
        }
        
    } catch(err) {
        const msj = err.response?.data?.msg || "Hubo un error al procesar tu pago.";
        error("Error de pago", msj);
    } finally {
        cargando.value = false;
    }
}
</script>

<template>
  <div class="pago-container row window-height window-width overflow-hidden non-selectable bg-forest-dark">
    
    <div class="col-12 col-md-6 flex flex-center relative-position bg-background-dark q-pa-xl">
        <div class="absolute-full bg-forest-dark opacity-8" style="z-index: 1;"></div>
        <q-img src="https://images.unsplash.com/photo-1623805986427-0c7ed7dce34a?q=80&w=2000" class="fit"
            style="filter: grayscale(40%) brightness(0.9);" />
        <div class="absolute-center text-center text-white" style="z-index: 2; width: 80%;">
            <q-icon name="stars" size="4rem" color="primary" class="q-mb-md" />
            <h2 class="text-h3 text-weight-bold q-mb-md">Eleva tu Conciencia</h2>
            <p class="text-h6 opacity-8 text-weight-light">
                Recibe guía espiritual diaria, y abre las puertas a un universo de comprensión numérologica.
            </p>
        </div>
    </div>

    <div class="col-12 col-md-6 flex flex-center q-pa-xl relative-position bg-moss-light">
      <q-card flat class="bg-white q-pa-lg shadow-24" style="width: 100%; max-width: 450px; border-radius: 20px;">
        <div class="text-center q-mb-lg">
            <q-avatar color="primary" text-color="dark" icon="payments" size="64px" class="q-mb-sm shadow-3" />
            <h1 class="text-h5 text-weight-bold text-moss q-mb-xs">Activar Suscripción</h1>
            <p class="text-earth text-body2">Completa el pago para sincronizar tus energías diarias.</p>
        </div>

        <q-form @submit.prevent="procesarPago" class="q-gutter-y-md">
            <div>
                <div class="text-caption text-weight-bold text-moss q-ml-sm q-mb-xs">Tu Correo</div>
                <q-input v-model="emailForm" type="email" outlined dense color="primary" :readonly="!!usuarioStore.email" />
            </div>

            <div class="q-mt-lg q-pa-md bg-grey-2" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                <div class="row justify-between items-center q-mb-sm">
                    <span class="text-weight-bold text-dark">Plan Mensual</span>
                    <span class="text-primary text-weight-bold text-subtitle1">$20.000 COP</span>
                </div>
                <div class="text-caption text-grey-6 text-italic">Acceso total por 30 días. Renovación manual o automática según disponibilidad.</div>
            </div>

            <q-btn type="submit" :loading="cargando" color="primary" text-color="dark" label="Pagar" class="full-width q-mt-xl text-weight-bold shadow-soft" rounded unelevated size="lg" no-caps>
                <template v-slot:loading>
                    Sincronizando...
                </template>
            </q-btn>

            <div class="text-center q-mt-md">
                <q-btn flat color="grey-6" label="Cancelar" size="sm" @click="router.back()" />
            </div>
        </q-form>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.bg-forest-dark {
    background-color: #1a2a22;
}
.bg-background-dark {
    background-color: #121212;
}
.bg-moss-light {
    background-color: #f1f4ec;
}
.text-moss {
    color: #2c4a3b;
}
.text-earth {
    color: #7d705c;
}
</style>
