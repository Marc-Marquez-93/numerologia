# 🌌 Análisis Técnico: ALMA BELLA

Este documento detalla la arquitectura, implementación y estado actual de la plataforma de numerología mística **ALMA BELLA**.

---

## 🏗️ Arquitectura General
El proyecto sigue una estructura de **Monorepo** con una clara separación entre el Backend (Node.js) y el Frontend (Vue 3).

- **Raíz:** Contiene configuraciones globales y scripts de despliegue.
- **`mongo/` (Backend):** Servidor API RESTful.
- **`numFront/` (Frontend):** Aplicación SPA moderna.

---

## 🔌 Backend (Node.js + Express + MongoDB)

### 1. Núcleo y Base de Datos
- **Express 5:** Utilizado para manejar las rutas y el middleware.
- **Mongoose 9:** Define tres modelos principales:
    - `Usuario`: Gestión de perfiles, roles (`admin`/`user`), estado de cuenta y recuperación por OTP.
    - `Lectura`: Almacena lecturas principales (tipo 0) y diarias (tipo 1).
    - `Pago`: Registra suscripciones y gestiona fechas de vencimiento (30 días por defecto).

### 2. Integración con Gemini AI
- **Librería:** `@google/genai`.
- **Modelo:** Detectada discrepancia entre `GEMINI.md` (`gemini-2.0-flash`) y el código en `lectura.js` (`gemini-3-flash-preview`).
- **Failover:** Implementa un sistema robusto de rotación de hasta 10 API Keys para evitar bloqueos por cuota.
- **Prompts:** Diseñados con un tono místico y espiritual, interpretando fechas de nacimiento.

### 3. Automatización (Cron Jobs)
- `cron-runner.js`: Un worker independiente que se ejecuta a las 7:00 AM (Bogotá).
- Genera automáticamente lecturas diarias para usuarios con pagos activos.
- Utiliza un `CRON_SECRET_TOKEN` para bypass de seguridad JWT.

### 4. Seguridad y Utilidades
- **Autenticación:** JWT en el header `x-token`.
- **Admin Verification:** Uso de `adminCode` sincronizado con `ADMIN_SECRET_KEY` para registro de personal.
- **Encriptación:** `bcryptjs` para contraseñas.
- **Comunicación:** `Nodemailer` configurado con Gmail para notificaciones y recuperación de cuenta.

---

## 🎨 Frontend (Vue 3 + Quasar + Pinia)

### 1. Stack Tecnológico
- **Quasar Framework:** Proporciona componentes UI premium con una estética "Glassmorphism" y temática de naturaleza (colores `forest-dark`, `moss`, `earth`).
- **Pinia:** Gestión de estado persistente (`Auth.js` y `Usuario.js`) mediante `pinia-plugin-persistedstate`.
- **Axios:** Cliente HTTP centralizado en `axios.js` con interceptores automáticos para inyectar el token JWT.

### 2. Flujo de Usuario
- **Inicio/Registro:** Formulario con validaciones en tiempo real y spinner de carga. Con logo decorativo no-interactivo.
- **UX Segura:** Restricción global de selección de texto (`user-select: none`) y diálogos de confirmación para salir de Dashboards.
- **Lectura Principal:** Generada inmediatamente tras el registro.
- **Dashboard:** Layout moderno con navegación por pestañas para lecturas y gestión de perfil.
- **Admin Panel:** Tabla avanzada en `dashboardAdmin.vue` que permite:
    - Registro de administradores mediante modal integrado (requiere código).
    - Filtrar usuarios vs administradores.
    - Buscar en tiempo real.
    - Editar datos completos (incluyendo cambio de rol y estado).
    - Activar/Inactivar o Eliminar cuentas con confirmación.

---

## 🔍 Hallazgos y Observaciones

| Área | Observación |
|---|---|
| **IA** | El código usa `gemini-3-flash-preview`. |
| **Seguridad** | Doble factor rudimentario con `adminCode` y rutas protegidas por JWT. |
| **UX** | Estética premium con Quasar; refinado con bloqueo de selección y confirmaciones de navegación. |
| **Mantenibilidad** | Lógica centralizada en servicios y composables. |

---

## 🚀 Próximos Pasos Sugeridos
1. **Pasarela Real:** Integrar Stripe o PayPal.
2. **Historial Extendido:** Ver más lecturas pasadas.
3. **Validación de Email:** Verificación post-registro.

---
*Análisis realizado por Antigravity 🛸*


3261302134
TESTUSER8406603171911622172
U26pAN0lr1
302134

----
5254 1336 7440 3564
123
11/30

---

4013 5406 8274 6260
123
11/30

---

3743 781877 55283
1234
11/30

---
4915 1120 5524 6507
123
11/30
