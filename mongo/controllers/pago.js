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

// Nueva función para confirmar desde el frontend
const confirmarPagoManual = async (req, res) => {
  try {
    const { payment_id, preference_id } = req.body;
    console.log(`🔍 Confirmación manual solicitada: Payment ${payment_id}, Preference ${preference_id}`);

    if (!payment_id) {
      return res.status(400).json({ msg: "Falta el payment_id" });
    }

    const resultado = await procesarEstadoPago(payment_id);
    
    if (resultado) {
      res.json({ msg: "Pago procesado con éxito", status: "approved" });
    } else {
      res.status(400).json({ msg: "El pago no está aprobado o no se encontró", status: "pending" });
    }
  } catch (error) {
    console.error("❌ Error en confirmación manual:", error);
    res.status(500).json({ msg: "Error interno", error: error.message });
  }
};

// Función interna reutilizable para procesar el estado
const procesarEstadoPago = async (paymentId) => {
    try {
        console.log(`⏳ Procesando estado del pago: ${paymentId}`);
        
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`❌ Error al consultar MP: ${response.status}`);
            return false;
        }

        const data = await response.json();
        console.log(`Estado en MP para ${paymentId}: ${data.status}`);

        if (data.status === "approved") {
            const email = data.external_reference;
            const preference_id = data.preference_id;

            // Intentamos buscar por preference_id primero, que es más seguro
            let pagoExistente = await Pago.findOne({ mp_preference_id: preference_id });
            
            if (!pagoExistente) {
                console.warn(`⚠️ No se encontró registro con preference_id ${preference_id}, buscando por email...`);
                pagoExistente = await Pago.findOne({ usuario_email: email, status: "pending" }).sort({ fecha_pago: -1 });
            }

            if (pagoExistente) {
                if (pagoExistente.status === "approved") {
                    console.log("ℹ️ El pago ya estaba marcado como aprobado.");
                    return true;
                }

                pagoExistente.status = "approved";
                pagoExistente.mp_payment_id = paymentId;
                
                const vencimiento = new Date();
                vencimiento.setDate(vencimiento.getDate() + 30);
                pagoExistente.vencimiento = vencimiento;
                
                await pagoExistente.save();
                console.log(`✅ Pago aprovado y guardado para ${email}`);
                return true;
            } else {
                console.error(`❌ No se encontró el registro de pago pendiente para ${email}`);
            }
        }
        return false;
    } catch (error) {
        console.error("❌ Error en procesarEstadoPago:", error);
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
