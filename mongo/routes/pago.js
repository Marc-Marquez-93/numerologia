import { Router } from "express";
import {
  getPago,
  getByUsuario,
  crearPreferencia,
  recibirWebhook,
  getEstado,
} from "../controllers/pago.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { check } from "express-validator";

const router = Router();

router.get("/", [validarJWT, validarCampos], getPago);

router.get("/:email", [
  validarJWT,
  check("email", "El email es obligatorio").isEmail(),
  validarCampos,
], getByUsuario);

router.post("/create-preference", [
  validarJWT,
  check("usuario_email", "El email es obligatorio").isEmail(),
  validarCampos,
], crearPreferencia);

router.post("/confirmar", [
  validarJWT,
  validarCampos,
], confirmarPagoManual);

router.post("/webhook", recibirWebhook);

router.get("/estado/:email", [
  validarJWT,
  check("email", "El email es obligatorio").isEmail(),
  validarCampos,
], getEstado);

export default router;