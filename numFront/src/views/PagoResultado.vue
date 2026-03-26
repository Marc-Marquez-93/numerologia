<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotify.js';
import { postData } from '../services/apiCliente.js';

const route = useRoute();
const router = useRouter();
const { success, error, info } = useNotifications();

const cargando = ref(false);
const verificado = ref(false);

// Extraemos los parámetros de la URL
// Nota: Vue Router puede devolver un array si el parámetro está repetido
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

onMounted(async () => {
    console.log("🏁 PagoResultado montado. Status URL:", statusUrl.value);
    console.log("IDS:", { paymentId, preferenceId });

    if (statusUrl.value === 'success' && paymentId) {
        await confirmarPago();
    } else if (statusUrl.value === 'failure') {
        error("Pago Fallido", "Hubo un problema con tu pago. Por favor intenta de nuevo.");
    } else if (statusUrl.value === 'pending') {
        info("Pago Pendiente", "Tu pago está en proceso. Te avisaremos cuando se confirme.");
    }
});

const confirmarPago = async () => {
    try {
        cargando.value = true;
        console.log("⏳ Solicitando confirmación al servidor...");
        
        // Llamamos al nuevo endpoint de confirmación manual
        const res = await postData('/pago/confirmar', {
            payment_id: paymentId,
            preference_id: preferenceId
        });

        console.log("✅ Respuesta del servidor:", res);
        
        if (res.status === 'approved') {
            verificado.value = true;
            success("¡Pago Verificado!", "Tu suscripción ha sido activada correctamente.");
        } else {
            info("En proceso", "El pago se recibió pero aún se está procesando en el sistema.");
        }
    } catch (err) {
        console.error("❌ Error al confirmar pago:", err);
        // No mostramos error crítico porque el webhook podría activarlo después
        info("Sincronizando", "Estamos terminando de procesar tu pago. Puedes revisar tu dashboard en unos minutos.");
    } finally {
        cargando.value = false;
    }
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
