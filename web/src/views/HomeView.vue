<script setup lang="ts">
</script>

<template>
    <div class="dashboard">
        <h1>Dashboard Avícola</h1>
        <div class="kpi-grid">
            <div class="kpi-card">
                <h3>Población Total</h3>
                <p class="value">45,000</p>
                <span class="trend up">+2% vs mes anterior</span>
            </div>
            <div class="kpi-card">
                <h3>Mortalidad (Hoy)</h3>
                <p class="value">0.15%</p>
                <span class="trend down">-0.05% vs promedio</span>
            </div>
            <div class="kpi-card">
                <h3>Producción Huevos</h3>
                <p class="value">12,500</p>
                <span class="trend up">+5% vs semana anterior</span>
            </div>
            <div class="kpi-card">
                <h3>ICA (Engorde)</h3>
                <p class="value">1.45</p>
                <span class="trend stable">Igual a meta</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.kpi-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.kpi-card h3 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
}

.kpi-card .value {
    font-size: 2rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.trend {
    font-size: 0.8rem;
}

.trend.up {
    color: #27ae60;
}

.trend.down {
    color: #c0392b;
}

.trend.stable {
    color: #7f8c8d;
}
</style>
