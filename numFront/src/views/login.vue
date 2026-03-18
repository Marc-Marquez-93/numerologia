<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { postData } from "../services/apiCliente.js";
import axiosInstance from "../plugins/axios.js"; // Para hacer el GET de los pagos directamente
import { useNotifications } from "../composables/useNotify.js";
import { useUsuarioStore } from "../stores/Usuario.js";
import { useAuthStore } from "../stores/Auth.js";

const router = useRouter();
const { success, error } = useNotifications();

const usuarioStore = useUsuarioStore();
const authStore = useAuthStore();

const form = ref({
    email: "",
    password: "",
});

const cargando = ref(false);
const mostrarPassword = ref(false); // Para el ojito de la contraseña

async function iniciarSesion() {
    // 1. Validaciones Frontend
    if (!form.value.email || form.value.email.trim() === "") {
        return error("Faltan datos", "Por favor ingresa tu correo electrónico.");
    }
    if (!form.value.password || form.value.password.trim() === "") {
        return error("Faltan datos", "Por favor ingresa tu contraseña.");
    }

    try {
        cargando.value = true;

        // 2. Hacemos el Login (Ajusta la ruta si tu endpoint de login es distinto)
        const resLogin = await postData("/usuario/login", form.value);

        // 3. Guardamos Token y Email en Pinia
        // Al guardar el token aquí, el interceptor de Axios ya lo empezará a usar en la siguiente petición
        if (resLogin.token) {
            authStore.token = resLogin.token;
        }
        usuarioStore.email = resLogin.usuario.email;

        // 4. Verificamos el estado del pago
        const emailUsuario = usuarioStore.email;
        const resPago = await axiosInstance.get(`/pago/estado/${emailUsuario}`);
        const estadoPago = resPago.data.estado;

        // 5. Activación de la verificación auxiliar directamente en el login
        if (estadoPago === "activo") {
            const ahora = new Date();
            try {
                // Bajamos todas las lecturas
                const resLecturas = await axiosInstance.get(`/lectura/usuario/${emailUsuario}`);
                const lecturasData = resLecturas.data.lecturas || [];
                
                // Extraemos solo las diarias
                const lecturasDiarias = lecturasData.filter(l => l.tipo === 1);
                
                const hoyString = ahora.toDateString();
                
                // Miramos si existe AL MENOS UNA que coindida con el string de 'hoy'
                const tieneLecturaHoy = lecturasDiarias.some(l => {
                    const dateL = new Date(l.fecha_lectura || l.createdAt);
                    return dateL.toDateString() === hoyString;
                });

                if (!tieneLecturaHoy) {
                    console.log("No hay lectura para hoy. Forzando generación auxiliar en login...");
                    await postData(`/lectura/diaria/${emailUsuario}`, {});
                    console.log("Generación exitosa.");
                } else {
                    console.log("La lectura diaria de hoy ya existe, saltando generación.");
                }
            } catch (errorAuxiliar) {
                 // El backend aborta con 400 si ya existe
                if (errorAuxiliar.response?.status === 400 && errorAuxiliar.response?.data?.msg?.includes("Ya tienes")) {
                     console.log("Backend bloqueó duplicado exitosamente.");
                } else {
                     console.error("Fallo inesperado al asegurar la lectura diaria en login:", errorAuxiliar);
                }
            }
        }

        success("¡Bienvenido de vuelta!", "Sincronizando tus energías...");

        // 6. Redirección basada en el estado
        // Redirigimos siempre al dashboard
        router.push("/dashboard");

    } catch (err) {
        console.log(err);
        const mensajeError = err.response?.data?.msg || err.response?.data?.message || "Credenciales incorrectas o error en el servidor.";
        error("Error al iniciar sesión", mensajeError);
    } finally {
        cargando.value = false;
    }
}
</script>

<template>
    <div class="row window-height window-width login-container overflow-hidden non-selectable">

        <div class="col-12 col-md-6 flex flex-center q-pa-xl bg-forest-dark relative-position">

            <div class="blob blob-login-primary"></div>

            <q-card flat class="login-box-glass q-pa-lg shadow-24" style="width: 100%; max-width: 420px; z-index: 1;">

                <div class="row items-center q-mb-xl cursor-pointer" @click="router.push('/')">
                    <q-avatar color="primary" text-color="dark" icon="auto_awesome" size="32px"
                        class="q-mr-sm shadow-3" />
                    <span class="text-h6 text-weight-bold text-uppercase text-dark tracking-widest">BEAUTY SOUL</span>
                </div>

                <div class="q-mb-lg">
                    <h1 class="text-h4 text-weight-bold text-dark q-mb-sm">Bienvenido de vuelta</h1>
                    <br>
                    <p class="text-grey-8 text-body1">Ingresa tus credenciales para renovar tu conexión espiritual.</p>
                </div>
                <br>

                <q-form @submit.prevent="iniciarSesion" class="q-gutter-y-lg">

                    <div>
                        <div
                            class="text-caption text-weight-bold text-uppercase text-dark q-ml-sm q-mb-xs tracking-wide">
                            Correo Electrónico
                        </div>
                        <q-input v-model="form.email" type="email" placeholder="tu@energia.com" bg-color="white"
                            color="primary" rounded outlined dense>
                            <template v-slot:prepend>
                                <q-icon name="mail_outline" color="grey-7" />
                            </template>
                        </q-input>
                    </div>

                    <div>
                        <div class="row justify-between items-center q-mb-xs">
                            <div class="text-caption text-weight-bold text-uppercase text-dark q-ml-sm tracking-wide">
                                Contraseña
                            </div>
                            <router-link to="/resPass"
                                class="text-caption text-primary text-weight-bold text-decoration-none hover-underline">
                                ¿Olvidaste tu contraseña?
                            </router-link>
                        </div>
                        <q-input v-model="form.password" :type="mostrarPassword ? 'text' : 'password'"
                            placeholder="••••••••" bg-color="white" color="primary" rounded outlined dense>
                            <template v-slot:prepend>
                                <q-icon name="lock_outline" color="grey-7" />
                            </template>
                            <template v-slot:append>
                                <q-icon :name="mostrarPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    color="grey-7" @click="mostrarPassword = !mostrarPassword" />
                            </template>
                        </q-input>
                    </div>

                    <q-btn type="submit" :loading="cargando" label="Iniciar Sesión" color="primary" text-color="dark"
                        class="full-width q-mt-lg q-py-sm text-weight-bold shadow-soft hover-scale" rounded unelevated
                        size="lg" no-caps>
                        <template v-slot:loading>
                            <q-spinner-hourglass class="on-left" />
                            Conectando...
                        </template>
                    </q-btn>
                </q-form>

                <div class="text-center q-mt-xl">
                    <p class="text-grey-8 text-body2">
                        ¿No tienes una cuenta?
                        <router-link to="/"
                            class="text-primary text-weight-bold text-decoration-none hover-underline q-ml-xs">
                            Comienza tu viaje
                        </router-link>
                    </p>
                </div>
            </q-card>
        </div>

        <div class="col-12 col-md-6 gt-sm relative-position bg-background-dark overflow-hidden">
            <div class="absolute-full bg-forest-dark opacity-4" style="z-index: 1;"></div>
            <q-img src="https://images.unsplash.com/photo-1603533867307-b354255e3c32?q=80&w=2000" class="fit"
                style="filter: grayscale(30%) brightness(0.8);" />
            <div class="absolute-bottom q-pa-xl text-white" style="z-index: 2;">
                <h3 class="text-h3 text-weight-bold q-mb-md" style="line-height: 1.2;">
                    El universo<br>habla en<br><span class="text-primary text-italic">números</span>.
                </h3>
                <p class="text-h6 opacity-8 text-weight-light" style="max-width: 400px;">
                    Descubre los patrones ocultos que guían tu camino y sincronízate con tu propósito vital.
                </p>
            </div>
        </div>

    </div>
</template>

<style scoped>
@import '../styles/login.css';
</style>