# 🌌 Análisis del Proyecto y Hoja de Ruta (GEMINI.md)

Hola, bro. He analizado a fondo tanto el **Backend** como el **Frontend** de tu aplicación. Aquí tienes un resumen detallado de lo que tienes construido y una propuesta de hacia dónde llevar el proyecto.

---

## 🔍 Resumen del Estado Actual

El proyecto es una plataforma de **Numerología Mística** que utiliza Inteligencia Artificial para generar lecturas personalizadas basadas en la fecha de nacimiento de los usuarios.

### 🔌 Backend (`mongo/mongo`)
*   **Motor Principal**: Node.js + Express + MongoDB.
*   **Inteligencia Artificial**: Integración con **Google Gemini (`gemini-3-flash-preview`)**. Tiene un sistema inteligente de "failover" que rota entre varias API Keys si una falla o excede la cuota.
*   **Seguridad**: Autenticación con JWT (JSON Web Tokens) y encriptación de contraseñas con `bcryptjs`.
*   **Funcionalidades Core**:
    *   **Lecturas Principal/Diaria**: Generación de consejos místicos basados en la fecha de nacimiento.
    *   **Gestión de Suscripciones**: Control de pagos con fechas de vencimiento para habilitar contenido premium (lecturas diarias).
    *   **Notificaciones**: Envío de correos automáticos vía `nodemailer` cuando se genera una lectura.

### 🎨 Frontend (`numFront`)
*   **Tecnologías**: Vue 3 + Vite + Quasar Framework + Pinia (Estado).
*   **Interfaz**: Diseño moderno y responsivo usando los componentes de Quasar.
*   **Módulos**:
    *   **Dashboards**: Vistas diferenciadas para Usuarios y Administradores.
    *   **Automatización**: Un servicio `cron.js` que se ejecuta a las 7:00 AM para disparar las lecturas de los usuarios activos.
    *   **Flujo de Usuario**: Registro, Login, Recuperación de contraseña y visualización de lecturas.

---

## 🚀 Hoja de Ruta (Roadmap) Progresivo

He dividido la hoja de ruta en 3 fases para que el crecimiento sea sólido:

### Fase 1: Estabilización y UX (Corto Plazo)
- [ ] **Pasarela de Pagos**: Actualmente el registro de pagos parece manual. Integrar **Stripe** o **PayPal** para automatizar el cobro y la activación de suscripciones.
- [ ] **Validaciones Robustas**: Mejorar los mensajes de error en el Front para que el usuario sepa exactamente qué falló (ej: "Tu saldo se agotó" en vez de "Error 400").
- [ ] **Historial de Lecturas**: Permitir que el usuario consulte todas sus lecturas pasadas en un formato de "diario místico".

### Fase 2: Potencia IA y Personalización (Medio Plazo)
- [ ] **Análisis Multi-Parámetro**: Pedir a Gemini que analice no solo la fecha de nacimiento, sino también el nombre completo (Numerología Onomástica).
- [ ] **Chatbot Místico**: Un chat directo con la IA (Gemini) para que los usuarios hagan preguntas específicas sobre sus lecturas.
- [ ] **Soporte Multi-idioma**: Traducir la interfaz y los prompts de la IA para llegar a un público global.

### Fase 3: Escalabilidad y Comunidad (Largo Plazo)
- [ ] **Mobile App**: Convertir el front (Quasar) en una App nativa usando **Capacitor** o **Cordova**.
- [ ] **Sistema de Referidos**: Recompensas por traer nuevos usuarios (ej: una semana gratis de lecturas diarias).
- [ ] **Seguridad Avanzada**: Implementar 2FA (Autenticación de dos factores) para cuentas de administrador.

---

## 🛠️ Notas Técnicas para Desarrolladores
*   **API Keys**: Asegúrate de que las `API_KEY` de Gemini en el `.env` estén siempre activas.
*   **Cron Job**: El archivo `cron.js` en el front debe estar corriendo en un proceso persistente (usando `pm2` por ejemplo) para que las lecturas se generen puntualmente.

---
*Generado por Antigravity 🛸*
