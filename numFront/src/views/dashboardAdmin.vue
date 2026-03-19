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

// Definir colores de marca en Quasar
import { setCssVar } from 'quasar';
setCssVar('primary', '#13ec5b'); // Verde Neón Principal
setCssVar('moss', '#2d4a34');    // Verde Musgo Oscuro
setCssVar('secondary', '#3d2b1f'); // Tierra

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
        router.push('/login');
        return;
    }
    cargarDataAdministrativa();
});

const volverInicio = () => {
    $q.dialog({
        title: 'Confirmar Salida',
        message: '¿Estás seguro de salir al inicio? Se cerrará la vista administrativa.',
        cancel: { flat: true, color: 'grey-7', noCaps: true, label: 'Cancelar' },
        persistent: true,
        ok: { color: 'moss', label: 'Sí, Salir', noCaps: true, unelevated: true }
    }).onOk(() => {
        router.push('/');
    });
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
        cancel: { flat: true, color: 'grey-7', label: 'Volver' },
        persistent: true,
        ok: { color: 'negative', label: 'Eliminar definitivamente', unelevated: true }
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

// --- CREACIÓN DE ADMINISTRADOR (NUEVO) ---
const mostrarModalCrear = ref(false);
const cargandoCrear = ref(false);
const adminNuevo = ref({
    nombre: '',
    email: '',
    password: '',
    adminCode: ''
});

const abrirModalCrear = () => {
    adminNuevo.value = { nombre: '', email: '', password: '', adminCode: '' };
    mostrarModalCrear.value = true;
};

const guardarNuevoAdmin = async () => {
    if (!adminNuevo.value.nombre || !adminNuevo.value.email || !adminNuevo.value.password || !adminNuevo.value.adminCode) {
        return $q.notify({ type: 'warning', message: 'Todos los campos son obligatorios' });
    }

    try {
        cargandoCrear.value = true;
        const payload = {
            nombre: adminNuevo.value.nombre,
            email: adminNuevo.value.email,
            password: adminNuevo.value.password,
            adminCode: adminNuevo.value.adminCode,
            rol: 'admin'
        };

        await axiosInstance.post('/usuario', payload);
        
        $q.notify({ type: 'positive', message: 'Administrador creado con éxito' });
        mostrarModalCrear.value = false;
        await cargarDataAdministrativa();
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.msg || 'Error al crear administrador';
        $q.notify({ type: 'negative', message: msg });
    } finally {
        cargandoCrear.value = false;
    }
};

// --- EDICIÓN DE USUARIO ---
const mostrarModalEditar = ref(false);
const cargandoEdicion = ref(false);
const usuarioEditar = ref({
    _id: '',
    nombre: '',
    email: '',
    rol: '',
    estado: 1,
    fecha_nacimiento: ''
});

const abrirModalEditar = (row) => {
    // Clonamos para no editar directamente en la tabla antes de guardar
    usuarioEditar.value = { 
        ...row,
        // Aseguramos que la fecha esté en formato YYYY-MM-DD para el input tipo date
        fecha_nacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento).toISOString().split('T')[0] : ''
    };
    mostrarModalEditar.value = true;
};

const guardarCambiosUsuario = async () => {
    if (!usuarioEditar.value.nombre || !usuarioEditar.value.email) {
        return $q.notify({ type: 'warning', message: 'Nombre y Correo son obligatorios' });
    }

    try {
        cargandoEdicion.value = true;
        
        // Usamos el email original para la ruta (está en row._email o similar si lo guardamos, o simplemente usamos el ID si el backend lo permite)
        // Pero el backend usa /usuario/:email. 
        // Nota: Si el admin cambia el email, el putUsuario del backend maneja 'email' como parámetro y 'email_nuevo' en el body.
        
        const payload = {
            nombre: usuarioEditar.value.nombre,
            email_nuevo: usuarioEditar.value.email,
            rol: usuarioEditar.value.rol,
            estado: usuarioEditar.value.estado,
            fecha_nacimiento: usuarioEditar.value.fecha_nacimiento
        };

        // Buscamos el email original en la lista original por el _id
        const userOriginal = todosUsuarios.value.find(u => u._id === usuarioEditar.value._id);
        const emailOriginal = userOriginal.email;

        await axiosInstance.put(`/usuario/${emailOriginal}`, payload);
        
        $q.notify({ type: 'positive', message: 'Usuario actualizado correctamente' });
        mostrarModalEditar.value = false;
        await cargarDataAdministrativa();
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.msg || 'Error al actualizar usuario';
        $q.notify({ type: 'negative', message: msg });
    } finally {
        cargandoEdicion.value = false;
    }
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
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-caption text-earth opacity-8 text-uppercase tracking-widest text-weight-bold">Administrador:</span>
                  <span class="text-caption text-moss text-weight-bolder text-uppercase">{{ usuarioStore.nombre }}</span>
                </div>
            </div>
        </div>
        
        <div class="row items-center q-gutter-x-md">
            <!-- Botón Crear Nuevo Admin -->
            <q-btn 
              @click="abrirModalCrear" 
              label="Crear Admin" 
              color="moss" 
              text-color="white" 
              icon="person_add" 
              rounded 
              unelevated 
              class="q-px-md text-weight-bold shadow-soft hover-scale" 
              no-caps 
            />

            <!-- Avatar del Admin -->
            <q-avatar color="primary" text-color="white" size="40px" class="shadow-soft border-moss">
              {{ usuarioStore.nombre ? usuarioStore.nombre.charAt(0).toUpperCase() : 'A' }}
            </q-avatar>
            <q-btn @click="volverInicio" round color="white" text-color="moss" icon="close" class="shadow-soft hover-scale" />
        </div>
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
                        <!-- Botón Editar -->
                        <q-btn round flat dense 
                            color="primary" 
                            icon="edit" 
                            title="Editar usuario"
                            @click="abrirModalEditar(props.row)"
                        />
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

    <!-- MODAL CREAR ADMINISTRADOR -->
    <q-dialog v-model="mostrarModalCrear" persistent>
        <q-card style="min-width: 400px; border-radius: 20px;" class="q-pa-md">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6 text-moss text-weight-bold">Nuevo Administrador</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-md q-gutter-y-md">
                <div class="text-center q-mb-md">
                    <q-avatar color="primary" text-color="dark" icon="person_add" size="60px" class="shadow-soft" />
                </div>
                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Nombre Completo</div>
                    <q-input v-model="adminNuevo.nombre" outlined dense color="primary" rounded placeholder="Ej. Alex Ferguson" />
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Correo Institucional</div>
                    <q-input v-model="adminNuevo.email" type="email" outlined dense color="primary" rounded placeholder="admin@almabella.com" />
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Contraseña Temporal</div>
                    <q-input v-model="adminNuevo.password" type="password" outlined dense color="primary" rounded placeholder="••••••••" />
                </div>

                <q-separator class="q-my-sm" />

                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Código Secreto Admin</div>
                    <q-input 
                        v-model="adminNuevo.adminCode" 
                        type="password" 
                        outlined 
                        dense 
                        color="secondary" 
                        rounded 
                        placeholder="Requerido para el Backend"
                        bg-color="amber-1"
                    >
                        <template v-slot:prepend>
                            <q-icon name="key" color="amber-9" />
                        </template>
                    </q-input>
                </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pt-lg">
                <q-btn flat label="Cancelar" color="grey-7" v-close-popup rounded no-caps />
                <q-btn 
                    label="Registrar Administrador" 
                    color="moss" 
                    text-color="white" 
                    @click="guardarNuevoAdmin" 
                    :loading="cargandoCrear"
                    rounded unelevated no-caps
                    class="q-px-lg shadow-soft text-weight-bold"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- MODAL EDITAR USUARIO -->
    <q-dialog v-model="mostrarModalEditar" persistent>
        <q-card style="min-width: 400px; border-radius: 20px;" class="q-pa-md">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6 text-moss text-weight-bold">Editar Usuario</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-md q-gutter-y-md">
                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Nombre Completo</div>
                    <q-input v-model="usuarioEditar.nombre" outlined dense color="primary" rounded />
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Correo Electrónico</div>
                    <q-input v-model="usuarioEditar.email" type="email" outlined dense color="primary" rounded />
                </div>

                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <div class="text-caption text-weight-bold text-moss q-mb-xs">Rol</div>
                        <q-select 
                            v-model="usuarioEditar.rol" 
                            :options="['user', 'admin']" 
                            outlined dense color="primary" rounded
                            emit-value
                            map-options
                        />
                    </div>
                    <div class="col-6">
                        <div class="text-caption text-weight-bold text-moss q-mb-xs">Fecha Nacimiento</div>
                        <q-input v-model="usuarioEditar.fecha_nacimiento" type="date" outlined dense color="primary" rounded />
                    </div>
                </div>

                <div>
                    <div class="text-caption text-weight-bold text-moss q-mb-xs">Estado de la Cuenta</div>
                    <q-btn-toggle
                        v-model="usuarioEditar.estado"
                        toggle-color="primary"
                        text-color="moss"
                        rounded unelevated
                        spread
                        :options="[
                            { label: 'Activo', value: 1 },
                            { label: 'Inactivo', value: 0 }
                        ]"
                        class="border-moss shadow-soft"
                    />
                </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pt-lg">
                <q-btn flat label="Cancelar" color="grey-7" v-close-popup rounded no-caps />
                <q-btn 
                    label="Guardar Cambios" 
                    color="primary" 
                    text-color="dark" 
                    @click="guardarCambiosUsuario" 
                    :loading="cargandoEdicion"
                    rounded unelevated no-caps
                    class="q-px-lg shadow-soft text-weight-bold"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>

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