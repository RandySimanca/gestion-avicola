<script setup lang="ts">
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import { RouterView } from 'vue-router'
</script>

<template>
    <div class="main-layout">
        <Sidebar />
        <div class="content-wrapper">
            <Header />
            <main class="page-content">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<style scoped>
.main-layout {
    display: flex;
    height: 100vh;
}

.content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.page-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}
</style>
