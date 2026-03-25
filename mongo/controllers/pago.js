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
    console.error(error);
    res.status(500).json({ msg: "Error al crear la preferencia de pago", error });
  }
};

const recibirWebhook = async (req, res) => {
  try {
    const { query } = req;
    const topic = query.topic || query.type;

    if (topic === "payment") {
      const paymentId = query.id || query["data.id"];
      
      // Aquí podrías usar el SDK para obtener el detalle del pago si fuera necesario
      // Pero para simplificar, si MP nos manda el webhook, actualizamos.
      // En un entorno real, validarías el estado del pago con el ID.
      
      // Buscamos el pago por external_reference (email) o preference_id si lo tuviéramos
      // Pero MP suele mandar el ID del pago. 
      // Para este MVP "Simple", vamos a confiar en la notificación básica o simplemente responder OK.
      // Lo ideal es consultar MP:
      
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });
      const data = await response.json();

      if (data.status === "approved") {
        const email = data.external_reference;
        const pagoExistente = await Pago.findOne({ mp_preference_id: data.preference_id });

        if (pagoExistente) {
          pagoExistente.status = "approved";
          pagoExistente.mp_payment_id = paymentId;
          
          const vencimiento = new Date();
          vencimiento.setDate(vencimiento.getDate() + 30);
          pagoExistente.vencimiento = vencimiento;
          
          await pagoExistente.save();
          console.log(`Pago aprobado para ${email}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
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

export { getPago, getByUsuario, crearPreferencia, recibirWebhook, getEstado };
