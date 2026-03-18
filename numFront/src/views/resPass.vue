<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { postData } from "../services/apiCliente.js";
import { useNotifications } from "../composables/useNotify.js";
import { useUsuarioStore } from "../stores/Usuario.js";

const router = useRouter();
const { success, error } = useNotifications();
const usuarioStore = useUsuarioStore();

// Estados
const paso = ref(1); // 1: Pedir email, 2: Poner código y nueva pass
const cargando = ref(false);

// Formulario
const email = ref(usuarioStore.email || ""); // Traemos el email de Pinia si existe
const codigoArr = ref(["", "", "", "", "", ""]); // Array para los 6 inputs
const password = ref("");
const confirmPassword = ref("");
const mostrarPassword = ref(false);
const mostrarConfirm = ref(false);

// Referencias para los 6 inputs del código OTP
const otpRefs = ref([]);

// --- FUNCIONES PARA MANEJAR LOS 6 INPUTS DEL CÓDIGO ---

const onOtpInput = (val, index) => {
  // Si escribe un número y no estamos en el último input, saltamos al siguiente
  if (val && index < 5) {
    otpRefs.value[index + 1].focus();
  }
};

const onOtpKeydown = (e, index) => {
  // Si presiona borrar y el input actual está vacío, devolvemos el foco al anterior
  if (e.key === "Backspace" && !codigoArr.value[index] && index > 0) {
    otpRefs.value[index - 1].focus();
  }
};

const onOtpPaste = (e) => {
  e.preventDefault();
  // Sacamos el texto pegado, solo tomamos números, hasta 6 dígitos
  const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
  
  if (pasteData) {
    const chars = pasteData.split("");
    chars.forEach((char, i) => {
      codigoArr.value[i] = char;
    });
    
    // Enfocamos el siguiente input vacío, o el último si se llenaron los 6
    nextTick(() => {
      const nextEmpty = codigoArr.value.findIndex(val => !val);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      otpRefs.value[focusIndex]?.focus();
    });
  }
};

// --- LLAMADAS AL BACKEND ---

const solicitarCodigo = async () => {
  if (!email.value || email.value.trim() === "") {
    return error("Faltan datos", "El correo es obligatorio.");
  }

  try {
    cargando.value = true;
    const res = await postData("/usuario/solicitarRecuperacion", { email: email.value });
    
    // Si todo sale bien
    success("Revisa tu bandeja", "Código enviado al correo con vigencia de 30 min.");
    paso.value = 2; // Cambiamos a la vista de poner el código

  } catch (err) {
    console.log(err);
    const msg = err.response?.data?.msg || err.response?.data?.message || "Error al solicitar recuperación.";
    error("No se pudo enviar", msg);
  } finally {
    cargando.value = false;
  }
};

const restablecerPass = async () => {
  // Unimos el array de los 6 inputs en un solo string
  const claveDinamica = codigoArr.value.join("");
  
  // Validaciones locales previas para ahorrar peticiones
  if (claveDinamica.length < 6) {
    return error("Datos incompletos", "El código debe tener 6 dígitos.");
  }
  if (password.value.length < 7 || password.value.length > 10) {
    return error("Contraseña inválida", "Debe tener entre 7 y 10 caracteres.");
  }
  if (password.value !== confirmPassword.value) {
    return error("Contraseña inválida", "Las contraseñas no coinciden en el formulario.");
  }

  try {
    cargando.value = true;

    // CONSTRUCCIÓN DEL PAYLOAD (Cuerpo de la petición)
    // Usamos los nombres exactos que tus controladores y validadores esperan
    const payload = {
      email: email.value,
      claveDinamica: claveDinamica,
      password: password.value,
      confirmarPassword: confirmPassword.value // <--- Nombre exacto para el custom validator
    };

    const res = await postData("/usuario/restablecerPassword", payload);
    
    // Si el servidor responde 200 OK
    success("¡Éxito!", res.msg);
    router.push("/login");

  } catch (err) {
    console.log(err);
    
    // Prioridad 1: Errores de validación (express-validator / Error 400)
    if (err.response?.data?.errors && err.response.data.errors.length > 0) {
      const primerErrorBackend = err.response.data.errors[0].msg;
      error("Error de validación", primerErrorBackend);
    } 
    // Prioridad 2: Errores del controlador (Usuario no encontrado, código vencido, etc.)
    else {
      const msg = err.response?.data?.msg || "Error al restablecer contraseña.";
      error("Operación fallida", msg);
    }
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div class="row window-height window-width bg-background-light flex flex-center non-selectable respass-container">
    
    <q-card flat class="bg-white q-pa-xl shadow-24 border-radius-xl relative-position" style="width: 100%; max-width: 500px; z-index: 1;">
      
      <div class="row justify-center q-mb-lg">
        <q-avatar color="primary" text-color="dark" icon="auto_awesome" size="48px" class="shadow-3" />
      </div>

      <div v-if="paso === 1" class="text-center">
        <h1 class="text-h4 text-weight-bold text-moss q-mb-sm">Restablecer Contraseña</h1>
        <p class="text-body1 text-earth opacity-8 q-mb-xl">
          Ingresa el correo electrónico asociado a tu cuenta para recibir las instrucciones de recuperación.
        </p>

        <q-form @submit.prevent="solicitarCodigo" class="q-gutter-y-md text-left">
          <div>
            <div class="text-caption text-weight-bold text-uppercase text-moss opacity-6 q-ml-sm q-mb-xs tracking-wide">
              Correo Electrónico
            </div>
            <q-input 
              v-model="email" 
              type="email" 
              placeholder="tu@correo.com" 
              bg-color="white" 
              color="primary" 
              rounded 
              outlined 
              dense 
            >
              <template v-slot:prepend>
                <q-icon name="mail_outline" color="grey-7" />
              </template>
            </q-input>
          </div>

          <q-btn 
            type="submit" 
            :loading="cargando"
            label="Enviar Código" 
            icon="auto_fix_high"
            color="primary" 
            text-color="dark" 
            class="full-width q-mt-lg q-py-sm text-weight-bold shadow-soft hover-scale" 
            rounded 
            unelevated 
            size="lg"
            no-caps 
          />
        </q-form>

        <div class="q-mt-xl">
          <router-link to="/login" class="inline-flex items-center text-sm font-medium text-earth hover-primary transition-colors text-decoration-none">
            <q-icon name="arrow_back" size="sm" class="q-mr-xs" />
            Volver al Inicio de Sesión
          </router-link>
        </div>
      </div>

      <div v-else class="text-center">
        <h1 class="text-h4 text-weight-bold text-moss q-mb-sm">Verificación de Identidad</h1>
        <p class="text-body2 text-earth opacity-8 q-mb-lg">
          Hemos enviado un código de 6 dígitos a <br><span class="text-weight-bold text-primary">{{ email }}</span>.
        </p>

        <q-form @submit.prevent="restablecerPass" class="q-gutter-y-lg text-left">
          
          <div>
            <div class="text-caption text-weight-bold text-uppercase text-moss opacity-6 q-ml-sm q-mb-xs tracking-wide text-center">
              Código de Seguridad
            </div>
            <div class="row justify-center q-gutter-x-sm q-mb-md">
              <q-input
                v-for="(digit, index) in 6" 
                :key="index"
                v-model="codigoArr[index]"
                :ref="el => { if(el) otpRefs[index] = el }"
                mask="#"
                maxlength="1"
                outlined
                class="otp-input"
                bg-color="grey-1"
                color="primary"
                @update:model-value="onOtpInput($event, index)"
                @keydown="onOtpKeydown($event, index)"
                @paste="onOtpPaste"
                input-class="text-center text-h5 text-weight-bold text-moss"
              />
            </div>
          </div>

          <div>
            <div class="text-caption text-weight-bold text-uppercase text-moss opacity-6 q-ml-sm q-mb-xs tracking-wide">
              Nueva Contraseña (7-10 caracteres)
            </div>
            <q-input 
              v-model="password" 
              :type="mostrarPassword ? 'text' : 'password'" 
              placeholder="••••••••" 
              bg-color="white" 
              color="primary" 
              rounded 
              outlined 
              dense 
            >
              <template v-slot:prepend>
                <q-icon name="lock_outline" color="grey-7" />
              </template>
              <template v-slot:append>
                <q-icon 
                  :name="mostrarPassword ? 'visibility_off' : 'visibility'" 
                  class="cursor-pointer" 
                  color="grey-7"
                  @click="mostrarPassword = !mostrarPassword"
                />
              </template>
            </q-input>
          </div>

          <div>
            <div class="text-caption text-weight-bold text-uppercase text-moss opacity-6 q-ml-sm q-mb-xs tracking-wide">
              Confirmar Contraseña
            </div>
            <q-input 
              v-model="confirmPassword" 
              :type="mostrarConfirm ? 'text' : 'password'" 
              placeholder="••••••••" 
              bg-color="white" 
              color="primary" 
              rounded 
              outlined 
              dense 
            >
              <template v-slot:prepend>
                <q-icon name="lock_outline" color="grey-7" />
              </template>
              <template v-slot:append>
                <q-icon 
                  :name="mostrarConfirm ? 'visibility_off' : 'visibility'" 
                  class="cursor-pointer" 
                  color="grey-7"
                  @click="mostrarConfirm = !mostrarConfirm"
                />
              </template>
            </q-input>
          </div>

          <q-btn 
            type="submit" 
            :loading="cargando"
            label="Restablecer contraseña" 
            color="primary" 
            text-color="dark" 
            class="full-width q-py-sm text-weight-bold shadow-soft hover-scale" 
            rounded 
            unelevated 
            size="lg"
            no-caps 
          />
        </q-form>

        <div class="q-mt-lg flex flex-center">
          <div class="flex items-center q-px-md q-py-sm bg-primary-light text-primary border-radius-lg" style="border: 1px solid rgba(19, 236, 91, 0.2)">
            <q-icon name="check_circle" size="xs" class="q-mr-sm" />
            <span class="text-caption text-weight-bold">Conexión segura y cifrada</span>
          </div>
        </div>
      </div>
    </q-card>

    <div class="absolute-bottom flex justify-center q-gutter-xl q-mb-xl opacity-4" style="z-index: 0;">
      <q-icon name="eco" color="primary" size="lg" />
      <q-icon name="self_improvement" color="primary" size="lg" />
      <q-icon name="grain" color="primary" size="lg" />
    </div>

  </div>
</template>

<style scoped>
@import '../styles/resPass.css';
</style>