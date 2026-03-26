<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotify.js';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const { success, error, info } = useNotifications();

const cargando = ref(false);
const verificado = ref(false);

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
    if (statusUrl.value === 'success' && paymentId) {
        await confirmarPago();
    } else if (statusUrl.value === 'failure') {
        error("Pago Fallido", "Hubo un problema con tu pago. Por favor intenta de nuevo.");
    } else if (statusUrl.value === 'pending') {
        info("Pago Pendiente", "Tu pago está en proceso. Te avisaremos cuando se confirme.");
    }
});

const confirmarPago = async () => {
    cargando.value = true;
    console.log("⏳ Enviando confirmación al backend...");

    // Usamos axios directamente SIN el interceptor JWT
    // porque el usuario puede no tener token activo al volver de MP
    const baseUrl = '/api';

    // Reintentamos hasta 3 veces con espera entre intentos
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
                return;
            }
        } catch (err) {
            console.warn(`⚠️ Intento ${intento} falló:`, err.response?.data?.msg || err.message);
            
            if (intento < 3) {
                // Esperar 2 segundos antes de reintentar
                console.log("⏳ Esperando 2s antes de reintentar...");
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    // Si después de 3 intentos no se pudo confirmar
    cargando.value = false;
    info("Procesando", "Tu pago fue recibido. Puede tardar unos minutos en activarse. Revisa tu dashboard pronto.");
};

const irAlDashboard = () => {
    router.push('/dashboard');
};

const irAlLogin = () => {
    router.push('/login');
};
</script>

<template>
  <div class="row window-height window-width flex-center bg-forest-dark non-selectable">
    <q-card flat class="bg-white q-pa-xl shadow-24 text-center" style="width: 100%; max-width: 500px; border-radius: 20px;">
        
        <!-- Estado: Éxito Verificado (o Success simple si ya terminó de cargar) -->
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
        <div v-else-if="statusUrl === 'failure'">
            <q-icon name="cancel" color="negative" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Algo salió mal</h1>
            <p class="text-body1 text-earth q-mb-xl">
                No pudimos procesar tu pago. No te preocupes, puedes intentarlo de nuevo o usar otro método.
            </p>
            <q-btn 
                label="Volver a Intentar" 
                color="primary" 
                text-color="dark" 
                rounded 
                unelevated 
                class="full-width text-weight-bold" 
                size="lg"
                @click="irAlLogin"
            />
        </div>

        <!-- Estado: Pendiente / Otros -->
        <div v-else>
            <q-icon name="hourglass_empty" color="warning" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Pago en proceso</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Estamos esperando la confirmación de Mercado Pago. Esto puede tardar unos minutos.
            </p>
            <q-btn 
                label="Volver a Inicio" 
                color="primary" 
                text-color="dark" 
                rounded 
                unelevated 
                class="full-width text-weight-bold" 
                size="lg"
                @click="irAlLogin"
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
