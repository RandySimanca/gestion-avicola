<script setup lang="ts">
import { ref } from 'vue'

interface Galpon {
    id: string;
    nombre: string;
    capacidad_max: number;
    tipo_ave: 'ENGORDE' | 'PONEDORA';
    finca_id: string;
}

const galpones = ref<Galpon[]>([
    { id: '1', nombre: 'Galpón 1', capacidad_max: 5000, tipo_ave: 'ENGORDE', finca_id: '1' },
    { id: '2', nombre: 'Galpón A', capacidad_max: 10000, tipo_ave: 'PONEDORA', finca_id: '2' }
])

const showForm = ref(false)
const newGalpon = ref({ nombre: '', capacidad_max: 0, tipo_ave: 'ENGORDE', finca_id: '' })

const saveGalpon = () => {
    galpones.value.push({
        id: Date.now().toString(),
        ...newGalpon.value
    } as Galpon)
    newGalpon.value = { nombre: '', capacidad_max: 0, tipo_ave: 'ENGORDE', finca_id: '' }
    showForm.value = false
}
</script>

<template>
    <div class="galpones-view">
        <div class="header-actions">
            <h1>Gestión de Galpones</h1>
            <button @click="showForm = true" class="btn-primary">Nuevo Galpón</button>
        </div>

        <div v-if="showForm" class="modal">
            <div class="modal-content">
                <h2>Nuevo Galpón</h2>
                <form @submit.prevent="saveGalpon">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input v-model="newGalpon.nombre" required />
                    </div>
                    <div class="form-group">
                        <label>Capacidad Máxima</label>
                        <input v-model.number="newGalpon.capacidad_max" type="number" required />
                    </div>
                    <div class="form-group">
                        <label>Tipo de Ave</label>
                        <select v-model="newGalpon.tipo_ave">
                            <option value="ENGORDE">Engorde</option>
                            <option value="PONEDORA">Ponedora</option>
                        </select>
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
                    <th>Capacidad</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="galpon in galpones" :key="galpon.id">
                    <td>{{ galpon.nombre }}</td>
                    <td>{{ galpon.capacidad_max }}</td>
                    <td>{{ galpon.tipo_ave }}</td>
                    <td>
                        <button class="btn-small">Editar</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
/* Reuse styles from FincasView or move to global css */
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

.form-group input,
.form-group select {
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
