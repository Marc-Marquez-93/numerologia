import cron from 'node-cron';
import axios from 'axios';
import 'dotenv/config'; // Usar la carga automática estándar de dotenv
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = process.env.API_URL || 'http://localhost:3000/api'; 
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'test-token';

console.log('🤖 CRON Job de Lecturas Diarias Iniciado');
console.log('Programado para ejecutarse todos los días a las 7:00 AM');

// Para pruebas tempranas puedes cambiar '0 7 * * *' por '* * * * *' (cada minuto)
cron.schedule('0 7 * * *', async () => {
    console.log(`\n[${new Date().toISOString()}] Iniciando chequeo de lecturas diarias...`);
    
    try {
        // 1. Obtener todos los pagos/usuarios con pago activo
        // Necesitamos configurar los headers para bypassar el JWT de usuario o tener un token master
        console.log('Obteniendo usuarios con pagos activos...');
        const responsePagos = await axios.get(`${API_URL}/pago`, {
            headers: {
                'x-token': CRON_SECRET_TOKEN // Asumiendo que generas un token master en tu env
            }
        });
        
        const pagos = responsePagos.data.pagos || [];
        const pagosActivos = pagos.filter(p => p.estado === 'activo');
        
        console.log(`Se encontraron ${pagosActivos.length} usuarios con suscripción activa.`);

        // 2. Por cada usuario activo, solicitar la generación de la lectura diaria
        let procesados = 0;
        let errores = 0;

        for (const pago of pagosActivos) {
            try {
                const email = pago.usuario_email;
                await axios.post(`${API_URL}/lectura/diaria/${email}`, {}, {
                    headers: {
                        'x-token': CRON_SECRET_TOKEN
                    }
                });
                console.log(`✅ Lectura generada para: ${email}`);
                procesados++;
            } catch (err) {
                console.error(`❌ Error generando lectura para ${pago.usuario_email}:`, err.response?.data?.msg || err.message);
                errores++;
            }
            
            // Pequeña pausa opcional para no saturar la API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n[${new Date().toISOString()}] Proceso terminado.`);
        console.log(`📊 Resumen: ${procesados} exitosos, ${errores} fallidos.`);

    } catch (error) {
        console.error('Error catastrófico en el CRON:', error.message);
    }
});
