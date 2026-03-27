<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotify.js';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useAuthStore } from '../stores/Auth.js';
import axios from 'axios';
import axiosInstance from '../plugins/axios.js';

const route = useRoute();
const router = useRouter();
const { success, error, info } = useNotifications();
const usuarioStore = useUsuarioStore();
const authStore = useAuthStore();

const cargando = ref(false);
const verificado = ref(false);
const pagoFallido = ref(false);

// Extraemos los parámetros de la URL
const getQueryParam = (param) => {
    const val = route.query[param];
    return Array.isArray(val) ? val[0] : val;
};

const statusUrl = computed(() => {
    const s = route.query.status;
    if (Array.isArray(s)) {
        return s.includes('success') ? 'success' : (s.includes('failure') ? 'failure' : 'pending');
    }
    return s || 'pending';
});

const paymentId = getQueryParam('payment_id') || getQueryParam('collection_id');
const preferenceId = getQueryParam('preference_id');
const externalReference = getQueryParam('external_reference');

console.log("🏁 PagoResultado cargado. Params extraídos:");
console.log("   statusUrl:", statusUrl.value);
console.log("   paymentId:", paymentId);
console.log("   preferenceId:", preferenceId);
console.log("   externalReference:", externalReference);

onMounted(async () => {
    if ((statusUrl.value === 'success' || statusUrl.value === 'failure') && paymentId) {
        await confirmarPago();
    } else if (statusUrl.value === 'failure') {
        pagoFallido.value = true;
        error("Pago Fallido", "Hubo un problema con tu pago. Por favor intenta de nuevo.");
    } else if (statusUrl.value === 'pending') {
        info("Pago Pendiente", "Tu pago está en proceso. Te avisaremos cuando se confirme.");
    }
});

const confirmarPago = async () => {
    cargando.value = true;
    console.log("⏳ Enviando confirmación al backend...");

    const baseUrl = '/api';

    for (let intento = 1; intento <= 3; intento++) {
        try {
            console.log(`Intento ${intento}/3...`);

            const res = await axios.post(`${baseUrl}/pago/confirmar`, {
                payment_id: paymentId,
                preference_id: preferenceId,
                external_reference: externalReference
            });

            console.log("✅ Respuesta del servidor:", res.data);
            
            if (res.data.status === 'approved') {
                verificado.value = true;
                cargando.value = false;
                success("¡Pago Verificado!", "Tu suscripción ha sido activada. ¡Disfruta de Alma Bella!");
                
                // Intentar generar lectura diaria automáticamente
                await generarLecturaDiaria();
                return;
            } else {
                cargando.value = false;
                pagoFallido.value = true;
                error("Pago no aprobado", res.data.msg || "Tu pago no fue aprobado por Mercado Pago.");
                return;
            }
        } catch (err) {
            console.warn(`⚠️ Intento ${intento} falló:`, err.response?.data?.msg || err.message);
            
            if (err.response?.status === 400) {
                cargando.value = false;
                pagoFallido.value = true;
                error("Pago no aprobado", err.response?.data?.msg || "Tu pago no fue aprobado.");
                return;
            }

            if (intento < 3) {
                console.log("⏳ Esperando 2s antes de reintentar...");
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    cargando.value = false;
    info("Procesando", "Tu pago fue recibido. Puede tardar unos minutos en activarse. Revisa tu dashboard pronto.");
};

const generarLecturaDiaria = async () => {
    const email = usuarioStore.email || externalReference;
    if (!email || !authStore.token) {
        console.log("ℹ️ No hay email/token para generar lectura diaria automática.");
        return;
    }
    try {
        console.log("🔮 Intentando generar lectura diaria post-pago...");
        await axiosInstance.post(`/lectura/diaria/${email}`);
        console.log("✅ Lectura diaria generada con éxito.");
    } catch (err) {
        // Si ya tiene lectura del día o cualquier otro motivo, no es crítico
        console.log("ℹ️ Lectura diaria no generada:", err.response?.data?.msg || err.message);
    }
};

const irAlDashboard = () => {
    router.push('/dashboard');
};

const reintentarPago = () => {
    router.push('/pago');
};
</script>

<template>
  <div class="row window-height window-width flex-center bg-forest-dark non-selectable">
    <q-card flat class="bg-white q-pa-xl shadow-24 text-center" style="width: 100%; max-width: 500px; border-radius: 20px;">
        
        <!-- Estado: Éxito Verificado -->
        <div v-if="statusUrl === 'success' && (verificado || !cargando)">
            <q-icon name="check_circle" color="positive" size="5rem" class="q-mb-md animate-pop" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">¡Pago Confirmado!</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Tu conexión con los astros ha sido renovada con éxito. Ya puedes disfrutar de todos los beneficios de Alma Bella.
            </p>
            <q-btn 
                label="Ir a mi Dashboard" 
                color="primary" 
                text-color="dark" 
                rounded 
                unelevated 
                class="full-width text-weight-bold shadow-soft" 
                size="lg"
                icon="dashboard"
                @click="irAlDashboard"
            />
        </div>
        
        <!-- Estado: Cargando / Verificando -->
        <div v-else-if="cargando">
            <q-spinner-hourglass color="primary" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Verificando Pago</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Estamos sincronizando tu pago con Mercado Pago. Un momento por favor...
            </p>
        </div>

        <!-- Estado: Fallo -->
        <div v-else-if="statusUrl === 'failure' || pagoFallido">
            <q-icon name="cancel" color="negative" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Algo salió mal</h1>
            <p class="text-body1 text-earth q-mb-xl">
                No pudimos procesar tu pago. No te preocupes, puedes intentarlo de nuevo o volver a tu dashboard.
            </p>
            <div class="column q-gutter-y-sm">
                <q-btn 
                    label="Reintentar Pago" 
                    color="primary" 
                    text-color="dark" 
                    rounded 
                    unelevated 
                    class="full-width text-weight-bold" 
                    size="lg"
                    icon="refresh"
                    @click="reintentarPago"
                />
                <q-btn 
                    label="Ir a mi Dashboard" 
                    flat
                    color="grey-8" 
                    rounded 
                    class="full-width text-weight-bold" 
                    size="md"
                    icon="dashboard"
                    @click="irAlDashboard"
                />
            </div>
        </div>

        <!-- Estado: Pendiente / Otros -->
        <div v-else>
            <q-icon name="hourglass_empty" color="warning" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Pago en proceso</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Estamos esperando la confirmación de Mercado Pago. Puedes revisar el estado en tu dashboard.
            </p>
            <q-btn 
                label="Ir a mi Dashboard" 
                color="primary" 
                text-color="dark" 
                rounded 
                unelevated 
                class="full-width text-weight-bold" 
                size="lg"
                icon="dashboard"
                @click="irAlDashboard"
            />
        </div>
    </q-card>
  </div>
</template>

<style scoped>
.bg-forest-dark {
    background-color: #1a2a22;
}
.text-moss {
    color: #2c4a3b;
}
.text-earth {
    color: #7d705c;
}
</style>
