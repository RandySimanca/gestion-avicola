<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '../services/api.service'

interface RegistroDiario {
  id: string
  lote_id: string
  fecha: string
  mortalidad_dia: number
  alimento_consumido_kg: number
  peso_promedio_g?: number
  huevos_totales?: number
  observaciones?: string
}

interface Lote {
  id: string
  galpon_id: string
  tipo_ave: 'ENGORDE' | 'PONEDORA'
  fecha_ingreso: string
  poblacion_inicial: number
  poblacion_actual: number
  activo: boolean
}

const registros = ref<RegistroDiario[]>([])
const lotes = ref<Lote[]>([])
const loading = ref(false)
const showForm = ref(false)
const selectedLote = ref<string | null>('')

const newRegistro = ref({
  lote_id: '',
  fecha: new Date().toISOString().split('T')[0],
  mortalidad_dia: 0,
  alimento_consumido_kg: 0,
  peso_promedio_g: undefined,
  huevos_totales: undefined,
  observaciones: ''
})

const showKPIs = ref(false)
const kpisData = ref<any>(null)

onMounted(async () => {
  await cargarLotes()
  await cargarRegistros()
})

async function cargarLotes() {
  loading.value = true
  try {
    const response = await apiService.getLotes()
    if (response.success) {
      lotes.value = response.data?.filter(lote => lote.activo) || []
    } else {
      console.error('Error al cargar lotes:', response.error)
    }
  } catch (error) {
    console.error('Error de conexión:', error)
  } finally {
    loading.value = false
  }
}

async function cargarRegistros() {
  if (!selectedLote.value) return
  
  loading.value = true
  try {
    const response = await apiService.getRegistrosDiariosPorLote(selectedLote.value)
    if (response.success) {
      registros.value = response.data || []
    } else {
      console.error('Error al cargar registros:', response.error)
    }
  } catch (error) {
    console.error('Error de conexión:', error)
  } finally {
    loading.value = false
  }
}

async function guardarRegistro() {
  if (!newRegistro.value.lote_id) {
    alert('Por favor seleccione un lote')
    return
  }

  loading.value = true
  try {
    const response = await apiService.createRegistroDiario(newRegistro.value)
    if (response.success) {
      await cargarRegistros()
      showForm.value = false
      resetForm()
      alert('Registro guardado exitosamente')
    } else {
      alert('Error al guardar registro: ' + response.error)
    }
  } catch (error) {
    console.error('Error de conexión:', error)
    alert('Error de conexión al guardar registro')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  newRegistro.value = {
    lote_id: '',
    fecha: new Date().toISOString().split('T')[0],
    mortalidad_dia: 0,
    alimento_consumido_kg: 0,
    peso_promedio_g: undefined,
    huevos_totales: undefined,
    observaciones: ''
  }
}

async function verKPIs() {
  if (!selectedLote.value) return
  
  loading.value = true
  try {
    const response = await apiService.getKPIsLote(selectedLote.value)
    if (response.success) {
      kpisData.value = response.data
      showKPIs.value = true
    } else {
      alert('Error al cargar KPIs: ' + response.error)
    }
  } catch (error) {
    console.error('Error de conexión:', error)
    alert('Error de conexión al cargar KPIs')
  } finally {
    loading.value = false
  }
}

function esLoteEngorde(lote: Lote | null): boolean {
  return lote?.tipo_ave === 'ENGORDE'
}
</script>

<template>
  <div class="registro-diario-view">
    <div class="header-actions">
      <h1>Registro Diario de Producción</h1>
      <div class="controls">
        <select v-model="selectedLote" @change="cargarRegistros" class="lote-selector">
          <option value="">Seleccione un lote...</option>
            <option v-for="lote in lotes" :key="lote.id" :value="lote.id">
                {{ lote.galpon_id }} - {{ lote.tipo_ave }} ({{ lote.poblacion_actual }} aves)
            </option>
        </select>
        <button @click="showForm = true" class="btn-primary">Nuevo Registro</button>
        <button @click="verKPIs" :disabled="!selectedLote" class="btn-secondary">Ver KPIs</button>
      </div>
    </div>

    <!-- Formulario de Nuevo Registro -->
    <div v-if="showForm" class="modal">
      <div class="modal-content">
        <h2>Nuevo Registro Diario</h2>
        <form @submit.prevent="guardarRegistro">
        <div class="form-group">
            <label>Lote</label>
            <select v-model="newRegistro.lote_id" required>
              <option value="">Seleccione...</option>
              <option v-for="lote in lotes" :key="lote.id" :value="lote.id">
                {{ lote.galpon_id }} - {{ lote.tipo_ave }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Fecha</label>
            <input v-model="newRegistro.fecha" type="date" required />
          </div>

          <div class="form-group">
            <label>Mortalidad del día</label>
            <input v-model="newRegistro.mortalidad_dia" type="number" min="0" required />
          </div>

          <div class="form-group">
            <label>Alimento consumido (kg)</label>
            <input v-model="newRegistro.alimento_consumido_kg" type="number" step="0.1" min="0" required />
          </div>

          <div v-if="esLoteEngorde(lotes.find(l => l.id === newRegistro.lote_id) || null)" class="form-group">
            <label>Peso promedio (g)</label>
            <input v-model="newRegistro.peso_promedio_g" type="number" step="0.1" min="0" />
          </div>

          <div v-if="!esLoteEngorde(lotes.find(l => l.id === newRegistro.lote_id) || null)" class="form-group">
            <label>Huevos totales</label>
            <input v-model="newRegistro.huevos_totales" type="number" min="0" />
          </div>

          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="newRegistro.observaciones" rows="3"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="showForm = false">Cancelar</button>
            <button type="submit" :disabled="loading" class="btn-primary">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de KPIs -->
    <div v-if="showKPIs" class="modal">
      <div class="modal-content">
        <h2>KPIs del Lote</h2>
        <div v-if="kpisData" class="kpis-container">
          <div class="kpi-card">
            <h3>Mortalidad</h3>
            <p class="kpi-value">{{ kpisData.tasa_mortalidad_porcentual }}%</p>
            <p class="kpi-detail">Total aves: {{ kpisData.mortalidad_acumulada }}</p>
          </div>

          <div v-if="kpisData.ica_acumulado" class="kpi-card">
            <h3>ICA (Conversión)</h3>
            <p class="kpi-value">{{ kpisData.ica_acumulado }}</p>
            <p class="kpi-detail">Alimento: {{ kpisData.alimento_consumido_total }}kg</p>
          </div>

          <div v-if="kpisData.postura_semanal_porcentual" class="kpi-card">
            <h3>Postura Semanal</h3>
            <p class="kpi-value">{{ kpisData.postura_semanal_porcentual }}%</p>
          </div>

          <div class="kpi-card">
            <h3>Días en Producción</h3>
            <p class="kpi-value">{{ kpisData.dias_en_produccion }}</p>
          </div>
        </div>
        <div class="form-actions">
          <button @click="showKPIs = false" class="btn-primary">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Tabla de Registros -->
    <div v-if="!showForm && !showKPIs" class="registros-table">
      <h2>Registros Recientes</h2>
      <div v-if="loading" class="loading">Cargando...</div>
      
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Mortalidad</th>
            <th>Alimento (kg)</th>
            <th v-if="selectedLote && esLoteEngorde(lotes.find(l => l.id === selectedLote) || null)">Peso (g)</th>
            <th v-if="selectedLote && !esLoteEngorde(lotes.find(l => l.id === selectedLote) || null)">Huevos</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="registro in registros" :key="registro.id">
            <td>{{ registro.fecha }}</td>
            <td>{{ registro.mortalidad_dia }}</td>
            <td>{{ registro.alimento_consumido_kg }}</td>
            <td v-if="registro.peso_promedio_g">{{ registro.peso_promedio_g }}</td>
            <td v-if="registro.huevos_totales">{{ registro.huevos_totales }}</td>
            <td>{{ registro.observaciones || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && registros.length === 0" class="no-data">
        <p>No hay registros para este lote</p>
        <p>Seleccione un lote y agregue nuevos registros diarios</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.registro-diario-view {
  padding: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.lote-selector {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 300px;
}

.btn-primary {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
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
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
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

.registros-table {
  margin-top: 2rem;
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

.loading {
  text-align: center;
  padding: 2rem;
  font-style: italic;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.kpis-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-align: center;
  background: #f8f9fa;
}

.kpi-card h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: bold;
  color: #27ae60;
  margin: 0.5rem 0;
}

.kpi-detail {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}
</style>
