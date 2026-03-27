import Pago from "../models/pagos.js";
import Usuario from "../models/usuario.js";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

const getPago = async (req, res) => {
  try {
    const pagos = await Pago.find();
    res.json({ pagos });
  } catch (error) {
    res.status(400).json({ error });
  }
};

const getByUsuario = async (req, res) => {
  try {
    const { email } = req.params;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const pagos = await Pago.find({ usuario_email: email });
    res.json({ pagos });
  } catch (error) {
    res.status(400).json({ error });
  }
};

const crearPreferencia = async (req, res) => {
  try {
    const { usuario_email } = req.body;
    console.log(`🛒 Creando preferencia para: ${usuario_email}`);

    const usuario = await Usuario.findOne({ email: usuario_email });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: "plan-mensual",
          title: "Suscripción Mensual - Alma Bella",
          quantity: 1,
          unit_price: 20000,
          currency_id: "COP",
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/#/pago-resultado?status=success`,
        failure: `${process.env.FRONTEND_URL}/#/pago-resultado?status=failure`,
        pending: `${process.env.FRONTEND_URL}/#/pago-resultado?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.BACKEND_URL}/api/pago/webhook`,
      external_reference: usuario_email,
    };

    const response = await preference.create({ body });
    console.log(`✅ Preferencia creada: ${response.id}`);

    const nuevoPago = new Pago({
      usuario_email,
      monto: 20000,
      status: "pending",
      mp_preference_id: response.id,
    });

    await nuevoPago.save();

    res.json({
      id: response.id,
      init_point: response.init_point,
    });
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    res.status(500).json({ msg: "Error al crear la preferencia de pago", error });
  }
};

const recibirWebhook = async (req, res) => {
  try {
    console.log("🔔 Webhook recibido de Mercado Pago");
    const { query, body } = req;
    
    // Mercado Pago puede enviar datos en query o en body dependiendo de la versión/tipo
    const id = query.id || body.data?.id || body.id;
    const topic = query.topic || query.type || body.type || body.topic;

    console.log(`Topic: ${topic}, ID: ${id}`);

    if (topic === "payment" || topic === "payment.updated") {
       await procesarEstadoPago(id);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.status(500).json({ error: error.message });
  }
};

// Nueva función para confirmar desde el frontend (NO requiere JWT)
const confirmarPagoManual = async (req, res) => {
  try {
    const { payment_id, preference_id, external_reference } = req.body;
    console.log(`\n🔍 ========= CONFIRMACIÓN MANUAL =========`);
    console.log(`Payment ID: ${payment_id}`);
    console.log(`Preference ID: ${preference_id}`);
    console.log(`External Ref: ${external_reference}`);
    console.log(`==========================================\n`);

    if (!payment_id) {
      return res.status(400).json({ msg: "Falta el payment_id" });
    }

    const resultado = await procesarEstadoPago(payment_id);
    
    if (resultado) {
      console.log(`✅ Confirmación manual exitosa para payment ${payment_id}`);
      res.json({ msg: "Pago procesado con éxito", status: "approved" });
    } else {
      console.warn(`⚠️ Confirmación manual: pago ${payment_id} no fue aprobado`);
      res.status(400).json({ msg: "El pago no fue aprobado por Mercado Pago. El estado real ha sido registrado.", status: "not_approved" });
    }
  } catch (error) {
    console.error("❌ Error en confirmación manual:", error);
    res.status(500).json({ msg: "Error interno", error: error.message });
  }
};

// Función interna reutilizable para procesar el estado (ATÓMICA)
const procesarEstadoPago = async (paymentId) => {
    try {
        console.log(`\n⏳ ========= PROCESANDO PAGO =========`);
        console.log(`Payment ID recibido: ${paymentId}`);
        
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error al consultar MP API: HTTP ${response.status}`);
            console.error(`Respuesta: ${errorText}`);
            return false;
        }

        const data = await response.json();
        console.log(`📦 Respuesta de MP API:`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Preference ID (MP): ${data.preference_id}`);
        console.log(`   External Reference: ${data.external_reference}`);
        console.log(`   Payment ID: ${data.id}`);

        const email = data.external_reference;
        const mpPreferenceId = data.preference_id;
        const mpStatus = data.status; // approved, rejected, cancelled, refunded, charged_back, in_process, pending

        // Mapear status de MP a nuestro enum del modelo
        const statusValidos = ["pending", "approved", "rejected", "in_process"];
        const statusParaBD = statusValidos.includes(mpStatus) ? mpStatus : "rejected";

        // Log de comparación para debug
        const pagosEnBD = await Pago.find({ usuario_email: email });
        console.log(`\n🔎 Pagos encontrados en BD para ${email}: ${pagosEnBD.length}`);
        pagosEnBD.forEach((p, i) => {
            console.log(`   [${i}] ID: ${p._id}, status: ${p.status}, mp_preference_id: "${p.mp_preference_id}"`);
        });
        console.log(`   MP nos dice preference_id: "${mpPreferenceId}", status: "${mpStatus}"`);

        // Campos a actualizar siempre
        const camposUpdate = {
            status: statusParaBD,
            mp_payment_id: String(paymentId),
        };

        // Solo asignar vencimiento si el pago fue aprobado
        if (statusParaBD === "approved") {
            camposUpdate.vencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // Búsqueda 1: por preference_id exacto
        let filtro = { mp_preference_id: mpPreferenceId };
        let pagoActualizado = await Pago.findOneAndUpdate(
            filtro,
            { $set: camposUpdate },
            { new: true }
        );

        if (pagoActualizado) {
            console.log(`✅ Pago actualizado por preference_id: ${pagoActualizado._id}`);
            console.log(`   Nuevo status: ${pagoActualizado.status}`);
            if (pagoActualizado.vencimiento) console.log(`   Vencimiento: ${pagoActualizado.vencimiento}`);
            return statusParaBD === "approved";
        }

        // Búsqueda 2: fallback por email + status pending (el más reciente)
        console.warn(`⚠️ No match por preference_id, intentando fallback por email + pending...`);
        filtro = { usuario_email: email, status: "pending" };
        pagoActualizado = await Pago.findOneAndUpdate(
            filtro,
            {
                $set: {
                    ...camposUpdate,
                    mp_preference_id: mpPreferenceId,
                }
            },
            { new: true, sort: { fecha_pago: -1 } }
        );

        if (pagoActualizado) {
            console.log(`✅ Pago actualizado por fallback email+pending: ${pagoActualizado._id}`);
            console.log(`   Nuevo status: ${pagoActualizado.status}`);
            if (pagoActualizado.vencimiento) console.log(`   Vencimiento: ${pagoActualizado.vencimiento}`);
            return statusParaBD === "approved";
        }

        console.error(`❌ No se encontró NINGÚN registro de pago para actualizar`);
        console.error(`   Email: ${email}, MP Preference: ${mpPreferenceId}`);
        
        console.log(`========= FIN PROCESAMIENTO =========\n`);
        return false;
    } catch (error) {
        console.error("❌ Error crítico en procesarEstadoPago:", error.message);
        return false;
    }
};

const getEstado = async (req, res) => {
  try {
    const { email } = req.params;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const pago = await Pago.findOne({ usuario_email: email, status: "approved" }).sort({
      fecha_pago: -1,
    });

    if (!pago) {
      return res.json({ estado: "sin pagos" });
    }

    const ahora = new Date();
    const estado = ahora <= pago.vencimiento ? "activo" : "vencido";

    res.json({
      estado,
      vencimiento: pago.vencimiento,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

export { getPago, getByUsuario, crearPreferencia, recibirWebhook, confirmarPagoManual, getEstado };
