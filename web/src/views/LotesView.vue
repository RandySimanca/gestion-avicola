<script setup lang="ts">
import { ref } from 'vue'

interface Lote {
    id: string;
    galpon_id: string;
    tipo_ave: 'ENGORDE' | 'PONEDORA';
    fecha_ingreso: string;
    poblacion_actual: number;
    activo: boolean;
}

const lotes = ref<Lote[]>([
    { id: '1', galpon_id: '1', tipo_ave: 'ENGORDE', fecha_ingreso: '2023-10-01', poblacion_actual: 4800, activo: true }
])

const showForm = ref(false)
const newLote = ref({ galpon_id: '', tipo_ave: 'ENGORDE', fecha_ingreso: '', poblacion_actual: 0, activo: true })

const saveLote = () => {
    lotes.value.push({
        id: Date.now().toString(),
        ...newLote.value
    } as Lote)
    newLote.value = { galpon_id: '', tipo_ave: 'ENGORDE', fecha_ingreso: '', poblacion_actual: 0, activo: true }
    showForm.value = false
}
</script>

<template>
    <div class="lotes-view">
        <div class="header-actions">
            <h1>Gestión de Lotes</h1>
            <button @click="showForm = true" class="btn-primary">Nuevo Lote</button>
        </div>

        <div v-if="showForm" class="modal">
            <div class="modal-content">
                <h2>Nuevo Lote</h2>
                <form @submit.prevent="saveLote">
                    <div class="form-group">
                        <label>Galpón ID</label>
                        <input v-model="newLote.galpon_id" required />
                    </div>
                    <div class="form-group">
                        <label>Fecha Ingreso</label>
                        <input v-model="newLote.fecha_ingreso" type="date" required />
                    </div>
                    <div class="form-group">
                        <label>Población Inicial</label>
                        <input v-model.number="newLote.poblacion_actual" type="number" required />
                    </div>
                    <div class="form-group">
                        <label>Tipo de Ave</label>
                        <select v-model="newLote.tipo_ave">
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
                    <th>Galpón</th>
                    <th>Fecha Ingreso</th>
                    <th>Población</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="lote in lotes" :key="lote.id">
                    <td>{{ lote.galpon_id }}</td>
                    <td>{{ lote.fecha_ingreso }}</td>
                    <td>{{ lote.poblacion_actual }}</td>
                    <td>{{ lote.activo ? 'Activo' : 'Cerrado' }}</td>
                    <td>
                        <button class="btn-small">Editar</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
/* Reuse styles */
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
