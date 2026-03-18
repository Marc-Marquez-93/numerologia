import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js"; // Importamos tu modelo correcto

const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({
      msg: "No hay token en la petición",
    });
  }

  // --- BYPASS PARA EL CRON JOB ---
  if (process.env.CRON_SECRET_TOKEN && token === process.env.CRON_SECRET_TOKEN) {
    // Es el robot del Cron, lo dejamos pasar asignándole un usuario "falso" de sistema
    req.usuario = {
      _id: 'cron_system',
      nombre: 'Sistema Automatizado',
      email: 'cron@sistema.local',
      rol: 'admin',
      estado: 1
    };
    return next();
  }
  // -------------------------------

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // Leer el usuario que corresponde al uid
    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(401).json({
        msg: "Token no válido - usuario no existe en DB",
      });
    }

    // Verificar si el uid tiene estado true (1)
    if (usuario.estado === 0) {
      return res.status(401).json({
        msg: "Token no válido - usuario con estado: false",
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({
      msg: "Token no válido",
    });
  }
};

export { validarJWT };