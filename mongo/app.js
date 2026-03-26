import express from "express"
import cors from "cors"
import 'dotenv/config'
import path from "path";
import { fileURLToPath } from "url";
import { conectarMongo } from "./database/cnx-mongo.js"
import usuarioRoute from "./routes/usuario.js"
import pagoRoute from "./routes/pago.js"
import lecturaRoute from "./routes/lectura.js"
import { iniciarCronLecturasDiarias } from "./helpers/cron-helper.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
conectarMongo()

app.use(cors())
app.use(express.json())

// API Routes
app.use("/api/usuario",usuarioRoute)
app.use("/api/lectura",lecturaRoute)
app.use("/api/pago",pagoRoute)

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "../numFront/dist")));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../numFront/dist/index.html"));
});

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Servidor escuchando en el puerto ${process.env.PORT || 3000}`);
    
    // 🔥 Iniciamos el Cron Helper para lecturas diarias
    iniciarCronLecturasDiarias();
})
