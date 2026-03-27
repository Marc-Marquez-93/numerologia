# 🌌 ALMA BELLA — Plataforma de Numerología Mística con IA

> Aplicación full-stack de numerología personalizada con lecturas generadas por Google Gemini AI.  
> **Marca:** ALMA BELLA | **Idioma:** Español | **Deploy:** Render (Monorepo)

---

## 🏗️ Arquitectura del Proyecto

```
mongo/                          ← Raíz del monorepo
├── package.json                ← Scripts de deploy (Render): postinstall, start, start:cron
├── .env                        ← Variables de entorno (compartido)
├── GEMINI.md                   ← Este archivo
├── mongo/                      ← 🔌 BACKEND (Node.js + Express + MongoDB)
│   ├── app.js                  ← Entry point, monta rutas y activa el Cron Helper
│   ├── controllers/            ← Lógica de negocio (usuario, lectura, pago)
│   ├── routes/                 ← Rutas REST protegidas con JWT
│   ├── models/                 ← Esquemas Mongoose (Usuario, Lectura, Pago)
│   ├── middlewares/            ← JWT validation, campo validación
│   ├── helpers/                ← Utilidades (email, cron-helper, JWT generation)
│   └── database/               ← Conexión MongoDB Atlas
└── numFront/                   ← 🎨 FRONTEND (Vue 3 + Vite + Quasar + Pinia)
    ├── src/
    │   ├── views/              ← 11 vistas (inicio, login, dashboards, lecturas, pago, etc.)
    │   ├── stores/             ← Pinia: Auth.js (token), Usuario.js (email, nombre)
    │   ├── plugins/            ← Axios con interceptor JWT automático
    │   ├── services/           ← apiCliente.js (wrappers GET/POST/PUT/DELETE)
    │   ├── composables/        ← useNotify.js, useFormatLectura.js
    │   ├── styles/             ← CSS por vista (inicio, login, lectura, resPass)
    │   └── router/             ← Vue Router con hash history
    └── vite.config.js          ← Config Vite + Quasar plugin

```

---

## 🔌 Backend — Stack y Funcionalidades

| Tecnología | Uso |
|---|---|
| **Express 5** | Framework HTTP |
| **MongoDB + Mongoose 9** | Base de datos NoSQL |
| **Google Gemini AI** (`@google/genai`) | Generación de lecturas numerológicas |
| **JWT** (`jsonwebtoken`) | Autenticación stateless |
| **bcryptjs** | Hashing de contraseñas |
| **Nodemailer** | Envío de correos (recuperación, notificaciones) |
| **node-cron** | Tareas programadas (lecturas diarias) |

### Endpoints API (`/api`)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/usuario` | Registro de usuario |
| `POST` | `/usuario/login` | Login (retorna JWT + datos) |
| `GET` | `/usuario` | Listar todos (admin, protegida) |
| `GET` | `/usuario/:email` | Obtener usuario por email |
| `PUT` | `/usuario/:email` | Editar usuario completo (nombre, email, rol, estado, fecha) |
| `PUT` | `/usuario/activar/:email` | Activar cuenta |
| `PUT` | `/usuario/inactivar/:email` | Inactivar cuenta |
| `DELETE` | `/usuario/:email` | Eliminar usuario |
| `POST` | `/usuario/solicitarRecuperacion` | Enviar código OTP por email |
| `POST` | `/usuario/restablecerPassword` | Validar OTP y cambiar contraseña |
| `POST` | `/usuario/cambiarPassword` | Cambiar contraseña (autenticado) |
| `POST` | `/lectura/:email` | Generar lectura principal (Gemini AI) |
| `POST` | `/lectura/diaria/:email` | Generar lectura diaria (Gemini AI) |
| `GET` | `/lectura/usuario/:email` | Obtener todas las lecturas de un usuario |
| `POST` | `/pago` | Registrar pago/suscripción |
| `POST` | `/pago/confirmar` | Confirmación manual de pago (Mercado Pago API) |
| `GET` | `/pago` | Listar todos los pagos |
| `GET` | `/pago/estado/:email` | Verificar estado de suscripción |

### Sistema de IA (Gemini)

- Usa `gemini-3-flash-preview` con failover entre múltiples API Keys
- Genera lecturas basadas en la **fecha de nacimiento** del usuario
- Dos tipos: Lectura Principal (única) y Lectura Diaria (recurrente)
- El prompt mystiocamente interpreta los números de la fecha

### Cron Job (Integrado en `app.js`)

- Se inicializa automáticamente al arrancar el servidor mediante el `cron-helper.js`.
- Se ejecuta diariamente a las **7:00 AM** (America/Bogota).
- Itera sobre usuarios con suscripción activa y genera sus lecturas diarias.
- Usa `CRON_SECRET_TOKEN` para bypass del middleware JWT.
- **Robustez**: Implementa reintentos y esperas de 1s para optimizar el uso de la IA.

### Seguridad

- **JWT** en header `x-token` para todas las rutas protegidas
- **bcryptjs** para hash de contraseñas
- **Usuarios inactivos** (`estado: 0`) no pueden iniciar sesión
- **CRON_SECRET_TOKEN** para autorizar el worker automático
- **Código OTP de 6 dígitos** con expiración de 30 min para recuperación de contraseña
- **ADMIN_SECRET_KEY**: Código de autorización requerido en el frontend para crear nuevas cuentas administrativas.
- **Navegación Protegida**: Diálogos de confirmación en Dashboards para evitar salidas accidentales.
- **UX Restringida**: Bloqueo global de `user-select` para prevenir resaltados de texto no deseados.

---

## 🎨 Frontend — Stack y Módulos

| Tecnología | Uso |
|---|---|
| **Vue 3** (Composition API + `<script setup>`) | Framework reactivo |
| **Vite 7** | Build tool |
| **Quasar 2** | UI Framework (componentes, iconos, notificaciones, diálogos) |
| **Pinia** + `pinia-plugin-persistedstate` | Estado global persistente |
| **Axios** | Cliente HTTP con interceptor JWT |

### Vistas (11 archivos)

| Vista | Ruta | Descripción |
|---|---|---|
| `inicio.vue` | `/` | Landing page + formulario de registro con spinner |
| `login.vue` | `/login` | Login de usuarios + generación auxiliar de lectura diaria |
| `lecturaPrincipal.vue` | `/lecturaPrincipal` | Primera lectura generada post-registro |
| `Dashboard.vue` | `/dashboard` | Layout con navbar (avatar + nombre) y rutas hijas |
| `DashboardLecturaPrincipal.vue` | `/dashboard/lectura-principal` | Vista de lectura principal dentro del dashboard |
| `LecturaDiaria.vue` | `/dashboard/lectura-diaria` | Historial de lecturas diarias (3 más recientes) |
| `Pago.vue` | `/pago` | Formulario de suscripción mensual |
| `loginAdmin.vue` | `/admin`, `/loginAdmin` | Login estilo "terminal" para administradores |
| `registrarAdmin.vue` | `/registrarAdmin` | Registro de administradores |
| `dashboardAdmin.vue` | `/dashboardAdmin` | Panel admin: tabla de usuarios, edición modal, activar/inactivar, eliminar |
| `resPass.vue` | `/resPass` | Recuperación de contraseña (OTP de 6 dígitos) |

### Dashboard Admin — Funcionalidades

- **Toggle Usuarios/Admins**: Filtra la tabla por rol
- **Botón Crear Admin**: Abre un modal integrado para registrar un administrador (requiere `adminCode`)
- **Botón Editar** (✏️): Abre modal para modificar nombre, email, rol, fecha y estado
- **Botón Activar/Inactivar** (⚠️/✅): Cambia el acceso del usuario
- **Botón Eliminar** (🗑️): Confirmación antes de borrar
- **Buscador**: Filtro en tiempo real por cualquier campo
- **Avatar personalizado**: Muestra la inicial del admin logueado

---

## ⚙️ Variables de Entorno (`.env`)

```env
# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
SECRETORPRIVATEKEY=tu_secreto_jwt

# Gemini AI (múltiples keys para failover)
API_KEY=key1
API_KEY2=key2
API_KEY3=key3

# Email (Nodemailer)
EMAIL_USER=correo@gmail.com
EMAIL_PASS=app_password

# Cron
CRON_SECRET_TOKEN=token_secreto_cron

# Security Admin Code
ADMIN_SECRET_KEY=clave_maestra_admin

# Server
PORT=3000
```

---

## 🚀 Deployment (Render — Monorepo)

### Web Service
- **Build**: `cd numFront && npm install && npm run build && cd ../mongo && npm install`
- **Start**: `cd mongo && node app.js`
- El backend sirve el `dist/` del frontend como archivos estáticos

### Background Worker (Opcional)
- **Start**: `cd mongo && node app.js`
- Puede ejecutarse como redundancia o proceso separado para tareas pesadas.

---

## 🛠️ Desarrollo Local

```bash
# Terminal 1: Backend
cd mongo
npm run dev          # Usa nodemon

# Terminal 2: Frontend
cd numFront
npm run dev          # Vite dev server en :5173
```

> ⚠️ Para desarrollo local, cambiar `baseURL` en `numFront/src/plugins/axios.js` de `/api` a `http://localhost:4500/api`

---

## 🚀 Hoja de Ruta (Roadmap)

### Fase 1: Estabilización y UX (Corto Plazo)
- [x] **Pasarela de Pagos**: Integración con Mercado Pago (Suscripción Manual)
- [ ] **Historial de Lecturas**: Diario místico con todas las lecturas pasadas
- [x] **Validaciones Robustas**: Mensajes de error claros en español
- [x] **Spinner de Registro**: Feedback visual durante el registro
- [x] **Edición de Usuarios**: Modal administrativo completo

### Fase 2: Potencia IA y Personalización (Medio Plazo)
- [ ] **Análisis Multi-Parámetro**: Numerología por nombre completo
- [ ] **Chatbot Místico**: Chat directo con Gemini AI
- [ ] **Soporte Multi-idioma**: Interfaz y prompts en múltiples idiomas

### Fase 3: Escalabilidad y Comunidad (Largo Plazo)
- [ ] **Mobile App**: Quasar + Capacitor para app nativa
- [ ] **Sistema de Referidos**: Recompensas por traer usuarios
- [ ] **2FA**: Autenticación de dos factores para admins

---

*Generado por Antigravity 🛸 — Última actualización: Marzo 2026 (Fix: Cron & Pagos)*
