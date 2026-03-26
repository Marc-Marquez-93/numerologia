import cron from 'node-cron';
import axios from 'axios';

/**
 * Helper para inicializar las tareas programadas (Cron Jobs)
 * Se ejecuta dentro del proceso principal de Node/Express
 */
const iniciarCronLecturasDiarias = () => {
    // Configuración: En app.js el puerto por defecto es 3000
    // Como corre en el mismo proceso, usamos localhost
    const PORT = process.env.PORT || 3000;
    const API_URL = `http://localhost:${PORT}/api`;
    const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'test-token';

    console.log('----------------------------------------------------');
    console.log('🤖 Cron Helper: Sistema de Lecturas Diarias Activado');
    console.log(`🕒 Zona Horaria: America/Bogota`);
    console.log(`📅 Programación: 7:00 AM todos los días`);
    console.log('----------------------------------------------------');

    // Tarea programada: 07:00 AM de Colombia
    cron.schedule('0 7 * * *', async () => {
        const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
        console.log(`\n[${timestamp}] 🚀 [CRON] Iniciando generación de lecturas diarias...`);

        try {
            // 1. Obtener pagos activos
            const responsePagos = await axios.get(`${API_URL}/pago`, {
                headers: { 'x-token': CRON_SECRET_TOKEN }
            });

            const pagos = responsePagos.data.pagos || [];
            const ahora = new Date();
            const activos = pagos.filter(p => 
                p.status === 'approved' && 
                p.vencimiento && 
                new Date(p.vencimiento) >= ahora
            );

            console.log(`📊 [CRON] Procesando ${activos.length} suscripciones activas.`);

            for (const pago of activos) {
                const email = pago.usuario_email;
                try {
                    await axios.post(`${API_URL}/lectura/diaria/${email}`, {}, {
                        headers: { 'x-token': CRON_SECRET_TOKEN }
                    });
                    console.log(`   ✅ Lectura diaria enviada a: ${email}`);
                } catch (err) {
                    console.error(`   ❌ Error con ${email}:`, err.response?.data?.msg || err.message);
                }
                
                // Pequeña pausa para no saturar
                await new Promise(r => setTimeout(r, 1000));
            }

            console.log(`[${new Date().toLocaleString('es-CO')}] ✨ [CRON] Finalizado.`);

        } catch (error) {
            console.error('🛑 [CRON ERROR]:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "America/Bogota"
    });
};

export { 
    iniciarCronLecturasDiarias 
};
