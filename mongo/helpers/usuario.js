import axios from 'axios'; // Importamos axios

export const esFechaValida = (value) => {
    const fechaEntrada = new Date(value);
    const ahora = new Date();

    if (fechaEntrada > ahora) {
        throw new Error("La fecha no puede ser mayor a la actual");
    }
    return true;
};

export const rolValido = (value) => {
    switch (Number(value)) {
        case 1: return "admin";
        case 0: return "user";
        default: throw new Error("Rol inválido");
    }
};

export const enviarCorreo = async function enviarCorreo(to, subject, body) {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
        console.warn("⚠️ No se enviará correo: faltan credenciales (BREVO_API_KEY/BREVO_SENDER_EMAIL)");
        return;
    }

    try {
        // --- TEMPLATE HTML "BONITO" ---
        const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a237e; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔮 Numerología Profesional</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff; color: #333; line-height: 1.6;">
                <h2 style="color: #1a237e;">¡Hola!</h2>
                <p style="font-size: 16px;">${body}</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://numerologia-2xv2.onrender.com" target="_blank" style="background-color: #ffc107; color: #000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Ir a la aplicación</a>
                </div>
            </div>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777; margin: 0;">
                    Este es un correo automático, por favor no respondas. <br>
                    © 2026 Numerología App - San Gil, Santander.
                </p>
            </div>
        </div>
        `;

        const url = 'https://api.brevo.com/v3/smtp/email';

        // Armamos el cuerpo de la petición
        const datosCorreo = {
            sender: {
                name: 'Soporte Numerología',
                email: process.env.BREVO_SENDER_EMAIL
            },
            to: [{ email: to }],
            subject: subject,
            textContent: body,
            htmlContent: htmlBody
        };

        // Hacemos la petición POST con Axios
        await axios.post(url, datosCorreo, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            }
        });

        console.log("✅ Correo enviado con Brevo (Axios) a:", to);

    } catch (error) {
        // Axios guarda los detalles del error del servidor en error.response.data
        const detalleError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error("❌ Error al enviar correo con Brevo:", detalleError);
    }
}

export const validarPasswordConfirmacion = (password, { req }) => {
    if (password !== req.body.confirmarPassword) {
        throw new Error('Las contraseñas no coinciden, verifica nuevamente');
    }
    return true;
};