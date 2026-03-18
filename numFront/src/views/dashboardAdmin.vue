<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/Usuario.js';
import { useAuthStore } from '../stores/Auth.js';
import { useQuasar } from 'quasar';
import axiosInstance from "../plugins/axios.js";
import { useNotifications } from '../composables/useNotify.js';

const router = useRouter();
const usuarioStore = useUsuarioStore();
const authStore = useAuthStore();
const $q = useQuasar();
const { error } = useNotifications();

const todosUsuarios = ref([]);
const cargando = ref(true);
const filtro = ref('');
const rolSeleccionado = ref('user');

// Filtrado por rol
const usuarios = computed(() => {
    return todosUsuarios.value.filter(u => {
        if (rolSeleccionado.value === 'user') {
            return u.rol !== 'admin' && u.rol !== 1;
        } else {
            return u.rol === 'admin' || u.rol === 1;
        }
    });
});

const tituloTabla = computed(() => {
    return rolSeleccionado.value === 'user' ? 'Usuarios Registrados' : 'Administradores';
});

// Definición de las columnas de Quasar Table
const columnas = [
  { name: 'nombres', align: 'left', label: 'Nombre Completo', field: 'nombre', sortable: true },
  { name: 'correo', align: 'left', label: 'Correo Electrónico', field: 'email', sortable: true },
  { name: 'edad', align: 'center', label: 'Nacimiento', field: row => formatDate(row.fecha_nacimiento), sortable: true },
  { name: 'estadoPago', align: 'center', label: 'Estado Suscripción', field: 'estadoPago', sortable: true },
  { name: 'estadoCuenta', align: 'center', label: 'Acceso', field: 'estado', sortable: true },
  { name: 'acciones', align: 'center', label: 'Acciones', field: 'acciones' }
];

const formatDate = (dateString) => {
    if (!dateString) return 'Desconocido';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Inválida';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const cargarDataAdministrativa = async () => {
    cargando.value = true;
    try {
        // 1. Cargar todos los usuarios (Requiere token en headers, lo hace axiosInstance automáticamente)
        const resUsuarios = await axiosInstance.get('/usuario');
        let usuariosData = resUsuarios.data.usuarios || [];

        // 2. Cargar todos los pagos para cruzarlos
        const resPagos = await axiosInstance.get('/pago');
        const pagosData = resPagos.data.pagos || [];

        const ahora = new Date();

        // 3. Cruzar info: Map para saber el estado de cada usuario
        todosUsuarios.value = usuariosData.map(user => {
            const pagosUsuario = pagosData.filter(p => p.usuario_email === user.email);
            let estadoSuscripcion = 'Sin Pagos';

            if (pagosUsuario.length > 0) {
                pagosUsuario.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
                const ultimoPago = pagosUsuario[0];

                if (new Date(ultimoPago.vencimiento) >= ahora) {
                    estadoSuscripcion = 'Activo';
                } else {
                    estadoSuscripcion = 'Vencido';
                }
            }

            return {
                ...user,
                estadoPago: estadoSuscripcion
            }
        });

    } catch (err) {
        console.error("Error cargando panel admin:", err);
        error('Acceso Denegado', 'No tienes los permisos para ver esta información o hubo un error de red.');
        
        // Si no es admin válido o el token falla, lo patemos al inicio
        if(err.response?.status === 401 || err.response?.status === 403) {
            router.push('/');
        }
    } finally {
        cargando.value = false;
    }
}

onMounted(() => {
    // Protección rudimentaria de ruta (el backend de todos modos frena si no hay token valido)
    if (!authStore.token) {
        router.push('/loginAdmin');
        return;
    }
    cargarDataAdministrativa();
});

const volverInicio = () => {
    router.push('/');
}

const cambiarEstado = async (row) => {
    try {
        cargando.value = true;
        const url = row.estado === 1 ? `/usuario/inactivar/${row.email}` : `/usuario/activar/${row.email}`;
        await axiosInstance.put(url);
        await cargarDataAdministrativa();
        $q.notify({ type: 'positive', message: row.estado === 1 ? 'Usuario inactivado' : 'Usuario activado' });
    } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: 'Error al cambiar estado' });
        cargando.value = false;
    }
};

const eliminarUsuarioAdmin = (row) => {
    $q.dialog({
        title: '¡Atención!',
        message: `¿Seguro que quiere eliminar al usuario ${row.nombre}? Perderá todas sus lecturas y pagos.`,
        cancel: true,
        persistent: true,
        ok: { color: 'negative', label: 'Eliminar definitivamente' }
    }).onOk(async () => {
        try {
            cargando.value = true;
            await axiosInstance.delete(`/usuario/${row.email}`);
            await cargarDataAdministrativa();
            $q.notify({ type: 'positive', message: 'Usuario eliminado con éxito' });
        } catch (err) {
            console.error(err);
            $q.notify({ type: 'negative', message: 'Error al eliminar usuario' });
            cargando.value = false;
        }
    });
};
</script>

<template>
  <div class="admin-container q-pa-md md:q-pa-xl flex column items-center">
    
    <!-- Header Admin -->
    <div class="full-width max-width row justify-between items-center q-mb-xl">
        <div class="row items-center q-gutter-sm">
            <q-avatar color="primary" text-color="dark" icon="admin_panel_settings" size="50px" class="shadow-soft" />
            <div>
                <h1 class="text-h4 text-weight-bold text-moss q-ma-none" style="line-height: 1;">Panel de Control</h1>
                <span class="text-caption text-earth opacity-8 text-uppercase tracking-widest text-weight-bold">Acceso Restringido</span>
            </div>
        </div>
        
        <q-btn @click="volverInicio" round color="white" text-color="moss" icon="close" class="shadow-soft hover-scale" />
    </div>

    <!-- Toggle Usuarios / Admins -->
    <div class="full-width max-width q-mb-lg flex justify-center">
        <q-btn-toggle
            v-model="rolSeleccionado"
            toggle-color="primary"
            text-color="moss"
            rounded unelevated
            class="shadow-soft"
            style="background: white;"
            :options="[
                { label: 'Usuarios', value: 'user', icon: 'people' },
                { label: 'Administradores', value: 'admin', icon: 'admin_panel_settings' }
            ]"
        />
    </div>

    <!-- Main Content -->
    <div class="full-width max-width q-px-sm">
        <q-card class="admin-card glass-card shadow-soft border-radius-xl" flat>
            <q-table
                :title="tituloTabla"
                :rows="usuarios"
                :columns="columnas"
                row-key="_id"
                :loading="cargando"
                :filter="filtro"
                class="bg-transparent"
                table-header-class="text-moss text-weight-bold bg-moss-light"
                separator="horizontal"
                flat
                hide-bottom
                :pagination="{ rowsPerPage: 0 }"
            >
                <!-- Buscador Lateral -->
                <template v-slot:top-right>
                    <q-input borderless dense debounce="300" v-model="filtro" placeholder="Buscar usuario...">
                        <template v-slot:append>
                            <q-icon name="search" color="moss" />
                        </template>
                    </q-input>
                </template>

                <!-- Personalización de la columna Estado de Pago -->
                <template v-slot:body-cell-estadoPago="props">
                    <q-td :props="props">
                        <q-chip 
                            :color="props.row.estadoPago === 'Activo' ? 'primary' : (props.row.estadoPago === 'Vencido' ? 'negative' : 'grey-5')"
                            :text-color="props.row.estadoPago === 'Activo' ? 'dark' : 'white'"
                            class="text-weight-bold"
                            size="sm"
                        >
                            {{ props.row.estadoPago }}
                        </q-chip>
                    </q-td>
                </template>

                <!-- Personalización de la columna Estado Cuenta -->
                <template v-slot:body-cell-estadoCuenta="props">
                    <q-td :props="props">
                        <q-chip outline 
                            :color="props.row.estado === 1 ? 'positive' : 'negative'"
                            size="sm"
                            class="text-weight-bold text-uppercase"
                        >
                            {{ props.row.estado === 1 ? 'Activo' : 'Inactivo' }}
                        </q-chip>
                    </q-td>
                </template>

                <!-- Columna de Acciones -->
                <template v-slot:body-cell-acciones="props">
                    <q-td :props="props" class="q-gutter-x-sm">
                        <!-- Botón Activar / Inactivar -->
                        <q-btn round flat dense 
                            :color="props.row.estado === 1 ? 'warning' : 'positive'" 
                            :icon="props.row.estado === 1 ? 'block' : 'check_circle'" 
                            :title="props.row.estado === 1 ? 'Inactivar usuario' : 'Activar usuario'"
                            @click="cambiarEstado(props.row)"
                        />
                        <!-- Botón Eliminar -->
                        <q-btn round flat dense 
                            color="negative" 
                            icon="delete" 
                            title="Eliminar usuario"
                            @click="eliminarUsuarioAdmin(props.row)"
                        />
                    </q-td>
                </template>

                <!-- Loading State -->
                <template v-slot:loading>
                    <q-inner-loading showing color="primary" />
                </template>
            </q-table>
        </q-card>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&display=swap');

.admin-container {
    font-family: 'Epilogue', sans-serif;
    min-height: 100vh;
    background-color: #f6f8f6; /* Fondo de la app */
}

/* PALETA */
.text-moss { color: #2d4a34; }
.bg-moss-light { background-color: rgba(45, 74, 52, 0.05); }
.text-earth { color: #3d2b1f; }
.opacity-8 { opacity: 0.8; }
.tracking-widest { letter-spacing: 0.1em; }

.shadow-soft { box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.border-radius-xl { border-radius: 24px; }

.glass-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
}

.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.05); }

/* Arreglando el buscador de Quasar para que encaje con el glassmorphism */
:deep(.q-table__top) {
    padding: 16px 24px;
    border-bottom: 1px solid rgba(45, 74, 52, 0.1);
}
:deep(.q-table__title) {
    font-weight: 700;
    color: #2d4a34;
    font-size: 1.25rem;
}
</style>