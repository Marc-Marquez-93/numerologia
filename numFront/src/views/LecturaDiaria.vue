<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useNotifications } from '../composables/useNotify.js';
import { postData } from '../services/apiCliente.js';
import axiosInstance from "../plugins/axios.js";
import { useFormatLectura } from '../composables/useFormatLectura.js';

const router = useRouter();
const usuarioStore = useUsuarioStore();
const { error, success } = useNotifications();
const { formatearTextoIA } = useFormatLectura();

const estadoPago = ref(null);
const lecturas = ref([]);
const cargando = ref(true);

const obtenerLecturas = async () => {
    try {
        const res = await axiosInstance.get(`/lectura/usuario/${usuarioStore.email}`);
        const lecturasData = res.data.lecturas || [];
        
        console.log("👉 Toda la info enviada por res.data:", res.data);
        console.log("👉 Array extraído lecturasData:", lecturasData);

        let diariasReves = lecturasData
            .filter(l => l.tipo === 1)
            .sort((a,b) => new Date(b.fecha_lectura || b.createdAt) - new Date(a.fecha_lectura || a.createdAt));

        console.log("👉 Array filtrado (solo tipo 1) y ordenado:", diariasReves);

        // Limitamos a mostrar solo las 3 más recientes como se indicó
        lecturas.value = diariasReves.slice(0, 3);

    } catch(err) {
        console.log("Error al recuperar lecturas:", err);
    }
}

const verificarEstado = async () => {
    if (!usuarioStore.email) return;
    try {
        const res = await axiosInstance.get(`/pago/estado/${usuarioStore.email}`);
        estadoPago.value = res.data.estado;
        if(estadoPago.value === 'activo') {
            await obtenerLecturas();
        }
    } catch(err) {
        console.log("Error al verificar pago:", err);
        estadoPago.value = 'inactivo';
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    verificarEstado();
});

const subirNivel = () => {
    router.push('/pago');
};

const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

</script>

<template>
  <div class="lectura-diaria-container flex column items-center q-pa-md md:q-pa-xl" style="min-height: 80vh">
    <div v-if="cargando" class="flex flex-center full-height full-width">
        <q-spinner-hourglass color="primary" size="4em" />
        <span class="q-ml-md text-moss">Sincronizando...</span>
    </div>

    <div v-else-if="estadoPago !== 'activo'" class="text-center column items-center justify-center full-width" style="max-width: 600px; margin-top: 10vh;">
      <q-icon name="lock" size="6rem" color="grey-6" class="q-mb-md opacity-8" />
      <h2 class="text-h4 text-weight-bold text-moss q-mb-lg">
        Contenido Premium
      </h2>
      <p class="text-body1 text-earth opacity-8 q-mb-xl">
        Ponte al día con tu mensualidad o activa tu plan para poder cumplirle a tu espiritualidad y recibir tus mensajes diarios.
      </p>

      <q-btn @click="subirNivel" color="primary" text-color="dark"
        label="Subir de nivel" icon-right="upgrade" size="xl" rounded unelevated
        class="text-weight-bold shadow-soft hover-scale q-px-xl py-sm" no-caps>
      </q-btn>
    </div>

    <div v-else class="full-width max-width q-mt-md" style="max-width: 800px;">
        <h2 class="text-h4 text-weight-bold text-moss q-mb-xl text-center">
          Tu Diario Espiritual
        </h2>
        
        <div v-if="lecturas.length === 0" class="text-center q-pa-xl bg-white shadow-soft" style="border-radius: 24px; border: 1px solid rgba(45, 74, 52, 0.05);">
            <q-icon name="auto_awesome" size="4rem" class="q-mb-md text-primary animate-bounce" />
            <p class="text-h6 text-moss font-tab">Todavía no tienes lecturas diarias generadas.<br><span class="text-body2 text-earth opacity-8">Se generarán automáticamente cada día a las 7 AM.</span></p>
        </div>

        <div v-else class="q-gutter-y-lg">
            <div 
                v-for="lectura in lecturas" :key="lectura._id" 
                class="lectura-card-wrapper shadow-soft hover-scale"
                style="transition: all 0.3s ease;"
            >
                <q-icon name="eco" size="2rem" class="text-moss ornament-leaf leaf-top-left" style="top: 1rem; left: 1rem;" />
                
                <q-expansion-item
                    expand-icon-class="text-primary text-h5"
                    class="bg-transparent"
                    header-class="q-pa-lg"
                >
                    <template v-slot:header>
                        <q-item-section avatar class="q-pr-md">
                            <q-avatar icon="auto_graph" color="primary" text-color="dark" size="xl" class="shadow-3" />
                        </q-item-section>
                        <q-item-section>
                            <div class="text-caption text-weight-bold text-primary text-uppercase tracking-widest q-mb-xs">
                                Mensaje Diario
                            </div>
                            <div class="text-weight-bold text-moss text-h5" style="letter-spacing: -0.5px;">{{ formatDate(lectura.fecha_lectura || lectura.createdAt) }}</div>
                        </q-item-section>
                    </template>

                    <q-card class="bg-transparent" flat>
                        <q-card-section class="q-px-xl q-pb-xl q-pt-none">
                            <div class="bg-moss-light q-pa-lg border-radius-lg fuente-mistica text-moss" 
                                style="line-height: 1.8; text-align: left;"
                                v-html="formatearTextoIA(lectura.contenido)">
                            </div>
                            
                            <div class="row items-center justify-center q-gutter-x-md q-pt-lg">
                                <div class="bg-grey-4" style="height: 1px; width: 40px"></div>
                                <q-icon name="stars" color="primary" size="xs" />
                                <div class="bg-grey-4" style="height: 1px; width: 40px"></div>
                            </div>
                        </q-card-section>
                    </q-card>
                </q-expansion-item>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/lecturaPrincipal.css';
</style>
