<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { postData } from '../services/apiCliente.js';
import { useNotifications } from '../composables/useNotify.js';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useAuthStore } from '../stores/Auth.js';
import axiosInstance from '../plugins/axios.js';

const router = useRouter();
const { error, success } = useNotifications();
const usuarioStore = useUsuarioStore();
const authStore = useAuthStore();

const form = ref({
    email: '',
    password: ''
});
const mostrarPassword = ref(false);
const cargando = ref(false);

const loginAdministrador = async () => {
    if (!form.value.email || !form.value.password) {
        return error("Error", "Ambos campos son obligatorios");
    }

    cargando.value = true;
    try {
        const res = await postData('/usuario/login', form.value);
        
        if (res.usuario.rol !== 'admin' && res.usuario.rol !== 1) {
            return error("Acceso Denegado", "Esta cuenta no tiene privilegios de administrador.");
        }

        // Guardamos el token en authStore (que es el que usa axiosInstance)
        authStore.token = res.token;
        usuarioStore.email = res.usuario.email;
        usuarioStore.nombre = res.usuario.nombre;
        
        success("Acceso Concedido", "Bienvenido al portal administrativo.");
        router.push('/dashboardAdmin');

    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.msg || err.response?.data?.message || "Credenciales incorrectas";
        error("Acceso Rechazado", msg);
    } finally {
        cargando.value = false;
    }
};

const irARegistro = () => {
    router.push('/registrarAdmin');
};

const volverInicio = () => {
    router.push('/');
}
</script>

<template>
  <div class="admin-auth-container flex flex-center">
    
    <!-- Botón Volver (Discreto) -->
    <q-btn @click="volverInicio" round flat color="grey-6" icon="arrow_back" class="absolute-top-left q-ma-md hover-glow" />

    <q-card class="admin-auth-card bg-dark-panel text-white shadow-24" flat>
        <q-card-section class="text-center q-pt-xl">
            <div class="q-mb-md">
                <q-icon name="admin_panel_settings" color="primary-glow" size="4rem" class="icon-glow" />
            </div>
            <h2 class="text-h4 text-weight-bold text-white q-ma-none font-cyber">ALMA BELLA <span class="text-primary-glow">Admin</span></h2>
            <p class="text-caption text-grey-5 tracking-widest text-uppercase q-mt-sm font-cyber">Portal de Acceso Seguro</p>
        </q-card-section>

        <q-card-section class="q-px-xl q-pb-xl">
            <q-form @submit.prevent="loginAdministrador" class="q-gutter-y-lg">
                
                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-grey-5 q-mb-xs font-cyber" style="letter-spacing: 1px;">Correo del Administrador</div>
                    <q-input 
                        v-model="form.email" 
                        type="email"
                        placeholder="admin@almabella.com" 
                        dark 
                        outlined 
                        dense 
                        class="cyber-input"
                    >
                        <template v-slot:prepend>
                            <q-icon name="person" color="grey-6" size="sm" />
                        </template>
                    </q-input>
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-grey-5 q-mb-xs font-cyber" style="letter-spacing: 1px;">Clave de Seguridad / Contraseña</div>
                    <q-input 
                        v-model="form.password" 
                        :type="mostrarPassword ? 'text' : 'password'"
                        placeholder="••••••••••••" 
                        dark 
                        outlined 
                        dense 
                        class="cyber-input"
                    >
                        <template v-slot:prepend>
                            <q-icon name="lock" color="grey-6" size="sm" />
                        </template>
                        <template v-slot:append>
                            <q-icon 
                                :name="mostrarPassword ? 'visibility_off' : 'visibility'" 
                                color="grey-6" 
                                class="cursor-pointer hover-white" 
                                @click="mostrarPassword = !mostrarPassword" 
                                size="sm"
                            />
                        </template>
                    </q-input>
                </div>

                <!-- Fake 2FA Notice para diseño táctico -->
                <div class="bg-dark-alert q-pa-md border-radius-sm row items-center q-gutter-x-sm border-left-glow q-mt-lg">
                    <q-icon name="security" color="primary-glow" size="xs" />
                    <div class="text-caption text-grey-4" style="line-height: 1.2;">
                        Cifrado de extremo a extremo activado. Su conexión es monitoreada estrictamente.
                    </div>
                </div>

                <q-btn 
                    type="submit" 
                    :loading="cargando"
                    label="Autorizar Acceso" 
                    icon-right="arrow_forward" 
                    class="full-width q-py-sm font-cyber text-weight-bold btn-authorize q-mt-lg" 
                    text-color="dark" 
                    unelevated
                />
            </q-form>

            <div class="text-center q-mt-xl text-caption font-cyber text-grey-6">
                ¿Nuevo personal autorizado? <span @click="irARegistro" class="text-primary-glow cursor-pointer hover-glow-text" style="text-decoration: underline;">Solicitar acceso a la terminal</span>
            </div>
        </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

.admin-auth-container {
    min-height: 100vh;
    background-color: #0d110f; /* Matrix dark style background */
    background-image: radial-gradient(circle at 50% 0%, rgba(19, 236, 91, 0.05) 0%, transparent 50%);
    font-family: 'Space Grotesk', sans-serif;
    user-select: none;
    -webkit-user-select: none;
}

input, textarea {
    user-select: auto !important;
    -webkit-user-select: auto !important;
}

.font-cyber {
    font-family: 'Space Grotesk', sans-serif !important;
}

.text-primary-glow {
    color: #13ec5b;
}

.bg-dark-panel {
    background-color: #151a17;
    border: 1px solid rgba(19, 236, 91, 0.1);
}

.bg-dark-alert {
    background-color: rgba(19, 236, 91, 0.05);
}

.border-left-glow {
    border-left: 3px solid #13ec5b;
}

.admin-auth-card {
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    /* Soft green glow shadow */
    box-shadow: 0 0 40px -10px rgba(19, 236, 91, 0.15) !important;
}

.icon-glow {
    filter: drop-shadow(0 0 10px rgba(19, 236, 91, 0.5));
}

.tracking-widest {
    letter-spacing: 0.15em;
}

/* Customizing Quasar dark inputs to look like a terminal */
:deep(.cyber-input .q-field__control) {
    background-color: #1a221d !important;
    border-radius: 8px;
}
:deep(.cyber-input .q-field__control:before) {
    border-color: rgba(255, 255, 255, 0.05) !important;
}
:deep(.cyber-input.q-field--focused .q-field__control:after) {
    border-color: #13ec5b !important;
    border-width: 1px;
    box-shadow: inset 0 0 0 1px rgba(19, 236, 91, 0.2);
}

.btn-authorize {
    background: linear-gradient(135deg, #13ec5b 0%, #0daa40 100%);
    border-radius: 8px;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
}

.btn-authorize:hover {
    box-shadow: 0 0 20px rgba(19, 236, 91, 0.4);
    transform: translateY(-2px);
}

.hover-glow:hover {
    color: white !important;
    background: rgba(19, 236, 91, 0.1) !important;
}

.hover-white:hover {
    color: white !important;
}

.hover-glow-text:hover {
    text-shadow: 0 0 8px rgba(19, 236, 91, 0.6);
}
</style>
