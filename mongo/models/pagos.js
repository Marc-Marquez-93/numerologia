import mongoose from "mongoose";

const pago = new mongoose.Schema({
  usuario_email: { type: String, required: true },
  fecha_pago: { type: Date, default: Date.now },
  metodo: { type: Number, default: 0 }, //0 tarjeta   1 efectivo 2 transferencia
  vencimiento: { type: Date },
  monto: { type: Number, default: 20000 },
  status: { type: String, enum: ["pending", "approved", "rejected", "in_process"], default: "pending" },
  mp_preference_id: { type: String },
  mp_payment_id: { type: String },
});
export default mongoose.model("Pago", pago);
