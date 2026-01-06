<template>
    <div class="admin-usuarios">
        <div class="header">
            <h1>Administración de Usuarios</h1>
            <p>Gestiona las solicitudes de registro y el estado de los usuarios del sistema.</p>
        </div>

        <!-- Usuarios Pendientes -->
        <div class="section card">
            <div class="section-header">
                <h2>Solicitudes Pendientes</h2>
                <span class="badge warning" v-if="pendingUsers.length">{{ pendingUsers.length }} pendientes</span>
            </div>

            <div v-if="loading" class="loading">Cargando usuarios...</div>
            <div v-else-if="pendingUsers.length === 0" class="empty-state">
                No hay solicitudes pendientes en este momento.
            </div>
            <div v-else class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol Solicitado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in pendingUsers" :key="user.id">
                            <td>{{ user.name }}</td>
                            <td>{{ user.email }}</td>
                            <td>
                                <select v-model="user.role" @change="handleRoleChange(user.id, user.role)"
                                    class="role-select">
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="GERENTE">GERENTE</option>
                                    <option value="GALPONERO">GALPONERO</option>
                                    <option value="CONTADOR">CONTADOR</option>
                                </select>
                            </td>
                            <td>{{ formatDate(user.createdAt) }}</td>
                            <td class="actions">
                                <button @click="approveUser(user.id)" class="btn-approve"
                                    :disabled="actionLoading === user.id">
                                    Aprobar
                                </button>
                                <button @click="rejectUser(user.id)" class="btn-reject"
                                    :disabled="actionLoading === user.id">
                                    Rechazar
                                </button>
                                <button @click="deleteUser(user.id)" class="btn-delete"
                                    :disabled="actionLoading === user.id">
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Todos los Usuarios -->
        <div class="section card">
            <div class="section-header">
                <h2>Usuarios del Sistema</h2>
            </div>

            <div v-if="loading" class="loading">Cargando usuarios...</div>
            <div v-else class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in otherUsers" :key="user.id">
                            <td>{{ user.name }}</td>
                            <td>{{ user.email }}</td>
                            <td>
                                <select v-model="user.role" @change="handleRoleChange(user.id, user.role)"
                                    class="role-select">
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="GERENTE">GERENTE</option>
                                    <option value="GALPONERO">GALPONERO</option>
                                    <option value="CONTADOR">CONTADOR</option>
                                </select>
                            </td>
                            <td>
                                <span :class="['status-badge', user.estado.toLowerCase()]">
                                    {{ user.estado }}
                                </span>
                            </td>
                            <td class="actions">
                                <button @click="toggleStatus(user.id)"
                                    :class="user.estado === 'ACTIVO' ? 'btn-deactivate' : 'btn-activate'"
                                    :disabled="actionLoading === user.id">
                                    {{ user.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                                </button>
                                <button @click="deleteUser(user.id)" class="btn-delete"
                                    :disabled="actionLoading === user.id">
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import apiService from '../services/api.service';

const users = ref<any[]>([]);
const loading = ref(true);
const actionLoading = ref<string | null>(null);

const pendingUsers = computed(() => users.value.filter(u => u.estado === 'PENDIENTE'));
const otherUsers = computed(() => users.value.filter(u => u.estado !== 'PENDIENTE'));

const loadUsers = async () => {
    loading.value = true;
    console.log('AdminUsuariosView: Loading users...');
    const response = await apiService.getAllUsers();
    console.log('AdminUsuariosView: API Response:', response);
    if (response.success && response.data) {
        users.value = response.data;
        console.log('AdminUsuariosView: Users loaded:', users.value.length);
    } else {
        console.error('AdminUsuariosView: Error loading users:', response.error);
    }
    loading.value = false;
};

const approveUser = async (id: string) => {
    actionLoading.value = id;
    const response = await apiService.approveUser(id);
    if (response.success) {
        await loadUsers();
    } else {
        alert('Error al aprobar usuario: ' + response.error);
    }
    actionLoading.value = null;
};

const rejectUser = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar a este usuario?')) return;

    actionLoading.value = id;
    const response = await apiService.rejectUser(id);
    if (response.success) {
        await loadUsers();
    } else {
        alert('Error al rechazar usuario: ' + response.error);
    }
    actionLoading.value = null;
};

const toggleStatus = async (id: string) => {
    actionLoading.value = id;
    const response = await apiService.toggleUserStatus(id);
    if (response.success) {
        await loadUsers();
    } else {
        alert('Error al cambiar estado: ' + response.error);
    }
    actionLoading.value = null;
};

const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de ELIMINAR permanentemente a este usuario? Esta acción no se puede deshacer.')) return;

    actionLoading.value = id;
    const response = await apiService.deleteUser(id);
    if (response.success) {
        await loadUsers();
    } else {
        alert('Error al eliminar usuario: ' + response.error);
    }
    actionLoading.value = null;
};

const handleRoleChange = async (userId: string, newRole: string) => {
    try {
        const response = await apiService.updateUserRole(userId, newRole);
        if (response.success) {
            console.log('AdminUsuariosView: Role updated successfully');
        } else {
            alert('Error al actualizar rol: ' + response.error);
            await loadUsers(); // Revertir cambio visual
        }
    } catch (error) {
        alert('Error de conexión al actualizar rol');
        await loadUsers();
    }
};

const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(loadUsers);
</script>

<style scoped>
.admin-usuarios {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.header {
    margin-bottom: 30px;
}

.header h1 {
    font-size: 2rem;
    color: #2c3e50;
    margin-bottom: 10px;
}

.header p {
    color: #7f8c8d;
}

.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    padding: 20px;
    margin-bottom: 30px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
}

.section-header h2 {
    font-size: 1.25rem;
    color: #34495e;
    margin: 0;
}

.badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
}

.badge.warning {
    background: #fff3cd;
    color: #856404;
}

.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th {
    text-align: left;
    padding: 12px;
    background: #f8f9fa;
    color: #7f8c8d;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

td {
    padding: 15px 12px;
    border-bottom: 1px solid #f1f1f1;
    color: #2c3e50;
}

.role-badge {
    background: #e1f5fe;
    color: #0288d1;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
}

.status-badge.activo {
    background: #e8f5e9;
    color: #2e7d32;
}

.status-badge.pendiente {
    background: #fff3cd;
    color: #856404;
}

.status-badge.rechazado {
    background: #ffebee;
    color: #c62828;
}

.status-badge.inactivo {
    background: #eeeeee;
    color: #616161;
}

.actions {
    display: flex;
    gap: 10px;
}

button {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-approve {
    background: #2ecc71;
    color: white;
}

.btn-approve:hover {
    background: #27ae60;
}

.btn-reject {
    background: #e74c3c;
    color: white;
}

.btn-reject:hover {
    background: #c0392b;
}

.btn-delete {
    background: #ff4757;
    color: white;
}

.btn-delete:hover {
    background: #ff6b81;
}

.btn-activate {
    background: #3498db;
    color: white;
}

.btn-activate:hover {
    background: #2980b9;
}

.btn-deactivate {
    background: #95a5a6;
    color: white;
}

.btn-deactivate:hover {
    background: #7f8c8d;
}

.loading,
.empty-state {
    text-align: center;
    padding: 40px;
    color: #95a5a6;
    font-style: italic;
}

.role-select {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background-color: #f9f9f9;
    font-size: 0.9rem;
    cursor: pointer;
}

.role-select:focus {
    outline: none;
    border-color: #3498db;
}
</style>
