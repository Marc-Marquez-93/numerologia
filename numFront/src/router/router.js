import loginAdmin from "../views/loginAdmin.vue"
import registrarAdmin from "../views/registrarAdmin.vue"
import dashboardAdmin from "../views/dashboardAdmin.vue"
import inicio from "../views/inicio.vue"
import resPass from "../views/resPass.vue"
import LecturaPrincipal from "../views/lecturaPrincipal.vue"
import Dashboard from "../views/Dashboard.vue"
import DashboardLecturaPrincipal from "../views/DashboardLecturaPrincipal.vue"
import LecturaDiaria from "../views/LecturaDiaria.vue"
import DashboardPagos from "../views/DashboardPagos.vue"
import Pago from "../views/Pago.vue"
import PagoResultado from "../views/PagoResultado.vue"
import { createRouter, createWebHashHistory } from "vue-router"

const rutas = [
    { path: "/", component: inicio },
    { path: "/login", component: loginAdmin },
    { path: "/lecturaPrincipal", component: LecturaPrincipal },
    { 
      path: "/dashboard", 
      component: Dashboard,
      children: [
        { path: "", redirect: "/dashboard/lectura-principal" },
        { path: "lectura-principal", component: DashboardLecturaPrincipal },
        { path: "lectura-diaria", component: LecturaDiaria },
        { path: "pagos", component: DashboardPagos }
      ]
    },
    { path: "/pago", component: Pago },
    { path: "/pago-resultado", component: PagoResultado },
    { path: "/admin", redirect: "/login" }, 
    { path: "/loginAdmin", redirect: "/login" },
    { path: "/registrarAdmin", component: registrarAdmin },
    { path: "/dashboardAdmin", component: dashboardAdmin },
    { path: "/resPass", component: resPass }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: rutas
})

export default router