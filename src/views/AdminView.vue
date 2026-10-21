<script setup>
import AdminSection from './AdminSection.vue'

const coreModels = [
  {
    name: 'Autores',
    route: '/autores'
  },
  {
    name: 'Categorias',
    route: '/categorias'
  },
  {
    name: 'Editoras',
    route: '/editoras'
  },
  {
    name: 'Livros',
    route: '/livrosAdmin'
  },
  {
    name: 'Reservas',
    route: '/reservas'
  },
  {
    name: 'Usuários',
    route: '/usuarioAdmin'
  }
]
</script>

<template>
  <div class="admin-page">

    <main class="admin-content">

      <h2>Administração do Sistema</h2>

      <AdminSection
        :models="coreModels"
      />

    </main>

  </div>
</template>

<style scoped>

.admin-page {
  min-height: 100vh;
  background: #232e3c;
  color: #fff;
}

.admin-header {
  background: #447f98;
  padding: 18px 46px;
}

.admin-header h1 {
  margin: 0;
  color: #f2d52e;
  font-size: 28px;
  font-weight: 400;
}

.admin-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

.admin-content h2 {
  font-size: 25px;
  font-weight: 400;
  margin: 0 0 30px;
}

.section-title {
  border-radius: 10px;
}

.admin-section {
  background: #000000;
}
</style>