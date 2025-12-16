<script setup lang="ts">
import { ref } from 'vue'

interface Finca {
    id: string;
    nombre: string;
    propietario: string;
}

const fincas = ref<Finca[]>([
    { id: '1', nombre: 'La Esperanza', propietario: 'Juan Perez' },
    { id: '2', nombre: 'El Amanecer', propietario: 'Maria Lopez' }
])

const showForm = ref(false)
const newFinca = ref({ nombre: '', propietario: '' })

const saveFinca = () => {
    // Mock save
    fincas.value.push({
        id: Date.now().toString(),
        ...newFinca.value
    })
    newFinca.value = { nombre: '', propietario: '' }
    showForm.value = false
}
</script>

<template>
    <div class="fincas-view">
        <div class="header-actions">
            <h1>Gestión de Fincas</h1>
            <button @click="showForm = true" class="btn-primary">Nueva Finca</button>
        </div>

        <div v-if="showForm" class="modal">
            <div class="modal-content">
                <h2>Nueva Finca</h2>
                <form @submit.prevent="saveFinca">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input v-model="newFinca.nombre" required />
                    </div>
                    <div class="form-group">
                        <label>Propietario</label>
                        <input v-model="newFinca.propietario" required />
                    </div>
                    <div class="form-actions">
                        <button type="button" @click="showForm = false">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Propietario</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="finca in fincas" :key="finca.id">
                    <td>{{ finca.nombre }}</td>
                    <td>{{ finca.propietario }}</td>
                    <td>
                        <button class="btn-small">Editar</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.btn-primary {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.data-table th,
.data-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 400px;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}
</style>
