# 🔑 Variables de Entorno para Render

Copia y pega estas variables en la sección **"Environment"** de tu Web Service en Render.

| Clave | Valor sugerido / Origen | Notas |
| :--- | :--- | :--- |
| **PORT** | `3000` | El puerto donde escuchará el servidor. |
| **MONGO_URI** | *(Tu URL de MongoDB Atlas)* | Ejemplo: `mongodb+srv://user:pass@cluster.mongodb.net/numerologia` |
| **SECRETORPRIVATEKEY** | *(Cualquier frase secreta)* | Se usa para generar los tokens JWT. |
| **API_KEY** | *(Tu Key de Gemini #1)* | Obligatoria para las lecturas. |
| **API_KEY2** | *(Tu Key de Gemini #2)* | Opcional (Failover). |
| **API_KEY3** | *(Tu Key de Gemini #3)* | Opcional (Failover). |
| **EMAIL_USER** | `respuestasnum@gmail.com` | Correo desde donde se envían las lecturas. |
| **EMAIL_PASS** | `uaylhepohaicecyx` | Contraseña de aplicación (App Password) de Gmail. |
| **ADMIN_SECRET_KEY** | `Sena2026*Migue` | Llave para registrar administradores. |
| **CRON_SECRET_TOKEN** | `test-token` | Token para que el Cron Job pueda llamar a la API. |
| **API_URL** | `http://localhost:3000/api` | **Actualizar** a tu URL de Render una vez desplegado. |

---
> [!IMPORTANT]
> - No incluyas espacios al copiar los valores.
> - La `MONGO_URI` no debe ser `localhost`, debe ser una base de datos en la nube (MongoDB Atlas).
> - Una vez que Render te de la URL de tu página (ej: `https://tu-app.onrender.com`), vuelve a las variables y cambia `API_URL` por `https://tu-app.onrender.com/api`.
