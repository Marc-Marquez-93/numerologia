<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { postData } from '../services/apiCliente.js';
import { useNotifications } from '../composables/useNotify.js';

const router = useRouter();
const { error, success } = useNotifications();

const form = ref({
    nombre: '',
    email: '',
    password: '',
    adminCode: '',
    rol: 1 // Rol fijo para administradores
});

const mostrarPassword = ref(false);
const cargando = ref(false);

const registrarAdministrador = async () => {
    // Validaciones básicas
    if (!form.value.nombre || !form.value.email || !form.value.password || !form.value.adminCode) {
        return error("Campos incompletos", "Todos los campos de seguridad son obligatorios para el registro de terminal.");
    }

    cargando.value = true;
    try {
        // El backend espera adminCode para validar la creación de ADMIN_ROLE
        const res = await postData('/usuario', form.value);
        
        success("Registro Exitoso", "Terminal administrativa autorizada. Ya puedes iniciar sesión.");
        router.push('/loginAdmin');

    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.msg || err.response?.data?.message || "No se pudo autorizar el registro.";
        error("Error de Autorización", msg);
    } finally {
        cargando.value = false;
    }
};

const volverLogin = () => {
    router.push('/loginAdmin');
};
</script>

<template>
  <div class="admin-auth-container flex flex-center">
    
    <q-card class="admin-auth-card bg-dark-panel text-white shadow-24" flat>
        <q-card-section class="text-center q-pt-xl">
            <div class="q-mb-md">
                <q-icon name="how_to_reg" color="primary-glow" size="4rem" class="icon-glow" />
            </div>
            <h2 class="text-h4 text-weight-bold text-white q-ma-none font-cyber">New<span class="text-primary-glow">Admin</span></h2>
            <p class="text-caption text-grey-5 tracking-widest text-uppercase q-mt-sm font-cyber">Terminal Personnel Registration</p>
        </q-card-section>

        <q-card-section class="q-px-xl q-pb-xl">
            <q-form @submit.prevent="registrarAdministrador" class="q-gutter-y-md">
                
                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-grey-5 q-mb-xs font-cyber">Full Name</div>
                    <q-input 
                        v-model="form.nombre" 
                        placeholder="Authorized Identity" 
                        dark 
                        outlined 
                        dense 
                        class="cyber-input"
                    >
                        <template v-slot:prepend>
                            <q-icon name="badge" color="grey-6" size="sm" />
                        </template>
                    </q-input>
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-grey-5 q-mb-xs font-cyber">Admin Email</div>
                    <q-input 
                        v-model="form.email" 
                        type="email"
                        placeholder="official@earthnumerology.com" 
                        dark 
                        outlined 
                        dense 
                        class="cyber-input"
                    >
                        <template v-slot:prepend>
                            <q-icon name="alternate_email" color="grey-6" size="sm" />
                        </template>
                    </q-input>
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-grey-5 q-mb-xs font-cyber">Security Password</div>
                    <q-input 
                        v-model="form.password" 
                        :type="mostrarPassword ? 'text' : 'password'"
                        placeholder="Encrypt Identity" 
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
                                class="cursor-pointer" 
                                @click="mostrarPassword = !mostrarPassword" 
                                size="sm"
                            />
                        </template>
                    </q-input>
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-uppercase text-primary-glow q-mb-xs font-cyber">Master Approval Key</div>
                    <q-input 
                        v-model="form.adminCode" 
                        type="password"
                        placeholder="Root Authorization Code" 
                        dark 
                        outlined 
                        dense 
                        class="cyber-input"
                    >
                        <template v-slot:prepend>
                            <q-icon name="vpn_key" color="primary-glow" size="sm" />
                        </template>
                    </q-input>
                </div>

                <q-btn 
                    type="submit" 
                    :loading="cargando"
                    label="Initialize Admin Account" 
                    icon-right="bolt" 
                    class="full-width q-py-sm font-cyber text-weight-bold btn-authorize q-mt-lg" 
                    text-color="dark" 
                    unelevated
                />
            </q-form>

            <div class="text-center q-mt-xl text-caption font-cyber text-grey-6">
                Already registered? <span @click="volverLogin" class="text-primary-glow cursor-pointer hover-glow-text" style="text-decoration: underline;">Open login terminal</span>
            </div>
        </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

.admin-auth-container {
    min-height: 100vh;
    background-color: #0d110f;
    background-image: radial-gradient(circle at 50% 100%, rgba(19, 236, 91, 0.05) 0%, transparent 50%);
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

.admin-auth-card {
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    box-shadow: 0 0 40px -10px rgba(19, 236, 91, 0.15) !important;
}

.icon-glow {
    filter: drop-shadow(0 0 10px rgba(19, 236, 91, 0.5));
}

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
}

.btn-authorize {
    background: linear-gradient(135deg, #13ec5b 0%, #0daa40 100%);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.btn-authorize:hover {
    box-shadow: 0 0 20px rgba(19, 236, 91, 0.4);
    transform: translateY(-2px);
}

.hover-glow-text:hover {
    text-shadow: 0 0 8px rgba(19, 236, 91, 0.6);
}
</style>
