<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/Usuario.js';
import axiosInstance from "../plugins/axios.js";

const router = useRouter();
const usuarioStore = useUsuarioStore();

const pagos = ref([]);
const cargando = ref(true);

const formatDate = (dateString) => {
    if (!dateString) return 'Desconocido';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Inválida';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(monto);
};

const cargarPagos = async () => {
    if (!usuarioStore.email) return;
    try {
        const res = await axiosInstance.get(`/pago/${usuarioStore.email}`);
        pagos.value = (res.data.pagos || []).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
    } catch (err) {
        console.error("Error cargando pagos:", err);
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    cargarPagos();
});

const irAPagar = () => {
    router.push('/pago');
};

const getStatusLabel = (status) => {
    const map = { approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado', in_process: 'En proceso' };
    return map[status] || status;
};

const getStatusColor = (status) => {
    const map = { approved: 'positive', pending: 'warning', rejected: 'negative', in_process: 'info' };
    return map[status] || 'grey';
};
</script>

<template>
  <div class="pagos-container flex column items-center q-pa-md md:q-pa-xl" style="min-height: 80vh">
    <div v-if="cargando" class="flex flex-center full-height full-width">
        <q-spinner-hourglass color="primary" size="4em" />
        <span class="q-ml-md text-moss">Cargando historial...</span>
    </div>

    <div v-else class="full-width" style="max-width: 700px;">
        <h2 class="text-h4 text-weight-bold text-moss q-mb-lg text-center">
          Historial de Pagos
        </h2>

        <div v-if="pagos.length === 0" class="text-center q-pa-xl bg-white shadow-soft" style="border-radius: 24px; border: 1px solid rgba(45, 74, 52, 0.05);">
            <q-icon name="receipt_long" size="4rem" class="q-mb-md text-grey-5" />
            <p class="text-h6 text-moss">No tienes pagos registrados aún.</p>
            <q-btn @click="irAPagar" color="primary" text-color="dark"
              label="Activar suscripción" icon-right="upgrade" size="lg" rounded unelevated
              class="text-weight-bold shadow-soft q-mt-md q-px-xl" no-caps />
        </div>

        <div v-else class="q-gutter-y-md">
            <q-card 
                v-for="pago in pagos" :key="pago._id" 
                flat 
                class="bg-white shadow-soft q-pa-lg"
                style="border-radius: 20px; border: 1px solid rgba(45, 74, 52, 0.05);"
            >
                <div class="row items-center justify-between">
                    <div>
                        <div class="text-caption text-weight-bold text-uppercase text-grey-6 q-mb-xs">Fecha</div>
                        <div class="text-weight-bold text-moss text-subtitle1">{{ formatDate(pago.fecha_pago) }}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-caption text-weight-bold text-uppercase text-grey-6 q-mb-xs">Monto</div>
                        <div class="text-weight-bolder text-h6 text-dark">{{ formatearMoneda(pago.monto) }}</div>
                    </div>
                </div>
                <div class="q-mt-sm flex justify-between items-center">
                    <q-chip 
                        :color="getStatusColor(pago.status)" 
                        text-color="white" 
                        size="sm" 
                        class="text-weight-bold"
                        icon="fiber_manual_record"
                    >
                        {{ getStatusLabel(pago.status) }}
                    </q-chip>
                    <div class="text-caption text-grey-6">
                        ID: <span class="text-moss text-weight-bold">{{ pago.mp_payment_id || 'N/A' }}</span>
                    </div>
                </div>
            </q-card>
        </div>
    </div>
  </div>
</template>

<style scoped>
.text-moss { color: #2d4a34; }
.shadow-soft { box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
</style>
