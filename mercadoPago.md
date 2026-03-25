# Mercado Pago – Integración en Proyecto Numeris

# 📌 Descripción General
# Integra Mercado Pago en Numeris (Express/MongoDB + Vue/Vite).
# Incluye instalación, configuración, backend, frontend, flujo y mejoras.

# ⚙️ Instalación
cd mongo (backend)
npm i mercadopago

cd Num-Front
npm i axios

# 🔑 Variables de Entorno
# Backend – Num-Back/.env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxx-xxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173

# Frontend – Num-Front/.env
VITE_API_URL=http://localhost:5040/api

# 📂 Estructura de Archivos
# Backend: config/mercadopago.js, controllers/mercadopago.js, models/pagos.js, routes/mercadopago.js
# Frontend: pluginAxios.js, services/mercadopago.js, payment.vue, payment-result.vue, router.js

# 🖥️ Backend – Código Clave
# Configuración SDK
import mercadopago from "mercadopago";
import dotenv from "dotenv";
dotenv.config();
const configureMercadoPago = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  mercadopago.configure({ access_token: accessToken });
  return mercadopago;
};
export { configureMercadoPago, mercadopago };

# Modelo de Pagos
const pagoSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ["pendiente","aprobado","rechazado","en_proceso"], default: "pendiente" },
  mpPaymentId: { type: String, default: "" },
  mpPreferenceId: { type: String, default: "" }
});

# Rutas API
router.post("/create-preference", validarJWT, crearPreferencia);
router.get("/verify-payment", validarJWT, verificarPago);
router.post("/webhook", recibirNotificacion);

# Controlador – Funciones
# crearPreferencia → crea ticket, guarda en BD, devuelve URL
# recibirNotificacion → webhook de MP, actualiza BD
# verificarPago → consulta estado en MP, actualiza BD

# 🎨 Frontend – Código Clave
# Servicio Mercado Pago
export const crearPreferenciaPago = async (monto, titulo) => {
  const response = await axiosInstance.post("/mercadopago/create-preference", { monto, titulo });
  return response.data;
};
export const verificarPago = async (paymentId) => {
  const response = await axiosInstance.get(`/mercadopago/verify-payment?payment_id=${paymentId}`);
  return response.data;
};

# Vista Checkout – payment.vue
const iniciarPago = async () => {
  const response = await crearPreferenciaPago(monto.value, tituloPlan.value);
  if (response.success) {
    window.location.href = response.sandbox_init_point || response.init_point;
  }
};

# Vista Resultado – payment-result.vue
onMounted(async () => {
  const paymentId = route.query.payment_id;
  if (paymentId) {
    const response = await verificarPago(paymentId);
    status.value = response.status || 'rejected';
  }
});

# 🔄 Flujo Paso a Paso
# 1. Usuario elige plan → /pagos?monto=10000&titulo=Plan Cósmico
# 2. payment.vue muestra botón “Pagar”
# 3. Frontend POST → /api/mercadopago/create-preference
# 4. Backend crea preferencia, guarda en BD, devuelve URL
# 5. Frontend redirige a Mercado Pago
# 6. Usuario paga en MP
# 7. MP redirige a /pagos/exito|fallo|pendiente
# 8. payment-result.vue llama verificarPago
# 9. Backend consulta estado en MP, actualiza BD
# 10. Frontend muestra resultado
# 11. Webhook paralelo asegura actualización

# 💡 Mejoras Opcionales
# 1. Usar variables de entorno para back_urls
# 2. Activar usuario solo cuando pago sea approved
# 3. Eliminar funciones duplicadas
# 4. Agregar auto_return: 'approved'
# 5. Migrar a SDK v2
# 6. Mostrar errores con notificaciones

# 📖 Conceptos Clave
# Preferencia → ticket de compra
# init_point → URL producción
# sandbox_init_point → URL pruebas
# Webhook → notificación automática
# external_reference → ID interno usuario
