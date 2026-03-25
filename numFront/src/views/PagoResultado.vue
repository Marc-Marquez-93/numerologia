<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifications } from '../composables/useNotify.js';

const route = useRoute();
const router = useRouter();
const { success, error, info } = useNotifications();

const status = ref(route.query.status || 'pending');

onMounted(() => {
    if (status.value === 'success') {
        success("¡Pago Exitoso!", "Tu suscripción se está activando. En breve podrás ver tu lectura diaria.");
    } else if (status.value === 'failure') {
        error("Pago Fallido", "Hubo un problema con tu pago. Por favor intenta de nuevo.");
    } else {
        info("Pago Pendiente", "Tu pago está en proceso. Te avisaremos cuando se confirme.");
    }
});

const irAlLogin = () => {
    router.push('/login');
};
</script>

<template>
  <div class="row window-height window-width flex-center bg-forest-dark non-selectable">
    <q-card flat class="bg-white q-pa-xl shadow-24 text-center" style="width: 100%; max-width: 500px; border-radius: 20px;">
        <div v-if="status === 'success'">
            <q-icon name="check_circle" color="positive" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">¡Gracias por tu compra!</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Tu conexión con los astros ha sido renovada. Por favor, inicia sesión para disfrutar de tu guía diaria.
            </p>
        </div>
        
        <div v-else-if="status === 'failure'">
            <q-icon name="cancel" color="negative" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Algo salió mal</h1>
            <p class="text-body1 text-earth q-mb-xl">
                No pudimos procesar tu pago. No te preocupes, puedes intentarlo de nuevo o usar otro método.
            </p>
        </div>

        <div v-else>
            <q-icon name="hourglass_empty" color="warning" size="5rem" class="q-mb-md" />
            <h1 class="text-h4 text-weight-bold text-moss q-mb-md">Pago en proceso</h1>
            <p class="text-body1 text-earth q-mb-xl">
                Estamos esperando la confirmación de Mercado Pago. Esto puede tardar unos minutos.
            </p>
        </div>

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
