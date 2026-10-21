<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: {
    type: String,
    required: true
  },

  models: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <section class="admin-section">

    <div
      v-for="model in models"
      :key="model.name"
      class="admin-row"
    >
      <RouterLink
        :to="model.route"
        class="model-name"
      >
        {{ model.name }}
      </RouterLink>
    </div>

  </section>
</template>

<style scoped>
.admin-section {
  margin-bottom: 38px;
}

.section-title {
  background: #0404e600;
  padding: 12px 15px;
  font-size: 16px;
  color: #fff;
}

.admin-row {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 15px;
  border-bottom: 1px solid #292929;
}

.admin-row:nth-child(even) {
  background: #222;
}

.model-name {
  display: block;
  width: 100%;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.model-name:hover {
  text-decoration: underline;
}
</style>