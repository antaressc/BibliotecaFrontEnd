<script setup>
import { ref, onMounted } from 'vue'
import { useReservaStore } from '@/stores/reserva'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import { formatarData } from '@/utils/formatters'
import { useRouter } from 'vue-router'

const router = useRouter()
const reservaStore = useReservaStore()
const toast = useToastStore()
const authStore = useAuthStore()
const mostrarPopupCancelar = ref(false)
const reservaParaCancelar = ref(null)

function voltarInicio() {
  if (authStore.isAdmin) {
    router.push({ name: 'admin' });
  } else {
    router.push({ name: 'livros' });
  }
}

onMounted(async () => {
  try {
    await reservaStore.getReservas()
  } catch (error) {
    toast.showToast(
      'Erro ao carregar reservas.',
      'error'
    )
  }
})

function cancelarReserva(id) {
  reservaParaCancelar.value = id
  mostrarPopupCancelar.value = true
}

async function confirmarCancelamento() {
  try {
    await reservaStore.cancelarReserva(
      reservaParaCancelar.value
    )

    toast.showToast(
      'Reserva cancelada com sucesso!',
      'success'
    )

    mostrarPopupCancelar.value = false
    reservaParaCancelar.value = null
  } catch (error) {
    const mensagem =
      error.response?.data?.detail ||
      'Erro ao cancelar a reserva.'

    toast.showToast(
      mensagem,
      'error'
    )
  }
}

async function registrarRetirada(id) {
  try {
    await reservaStore.registrarRetirada(id)

    toast.showToast('Retirada registrada com sucesso!', 'success')
    await reservaStore.getReservas()
  } catch (error) {
    console.error('Erro ao registrar retirada:', error.response?.data)

    const mensagem =
      error.response?.data?.detail ||
      'Erro ao registrar a retirada.'

    toast.showToast(mensagem, 'error')
  }
}

async function registrarDevolucao(id) {
  try {
    await reservaStore.registrarDevolucao(id)

    toast.showToast('Devolução registrada com sucesso!', 'success')
    await reservaStore.getReservas()
  } catch (error) {
    const mensagem =
      error.response?.data?.detail ||
      'Erro ao registrar a devolução.'

    toast.showToast(mensagem, 'error')
  }
}

function fecharPopupCancelar() {
  mostrarPopupCancelar.value = false
  reservaParaCancelar.value = null
}

function badgeClass(status) {
  const map = {
    pendente: 'badge-warning',
    reservada: 'badge-info',
    confirmado: 'badge-info',
    retirada: 'badge-success',
    retirado: 'badge-success',
    devolvida: 'badge-muted',
    devolvido: 'badge-muted',
    cancelada: 'badge-muted',
    cancelado: 'badge-muted'
  }

  return map[status?.toLowerCase()] || 'badge-muted'
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <button class="btn-voltar" @click="voltarInicio" title="Voltar">
        &lt;
      </button>


      <h1 class="page-title">
        {{ authStore.user?.is_superuser ? 'Reservas' : 'Minhas Reservas' }}
      </h1>

    </div>

    <div v-if="!reservaStore.reservas.length" class="empty-state">
      <p>Nenhuma reserva encontrada.</p>
    </div>

    <div class="reservas-list" v-else>
      <div v-for="reserva in reservaStore.reservas" :key="reserva.id" class="card">

        <div class="reserva-header">
          <strong>Reserva #{{ reserva.id }}</strong>

          <span class="badge" :class="badgeClass(reserva.status)">
            {{ reserva.status }}
          </span>
        </div>

        <!-- Nome do usuário -->
        <div class="usuario-info" v-if="reserva.usuario">
          <strong>Usuário:</strong> {{ reserva.usuario }}
        </div>

        <!-- Títulos dos livros -->
        <ul class="reserva-itens" v-if="reserva.itens?.length">
          <li v-for="(item, idx) in reserva.itens" :key="item.id || idx">
            {{ item.livro.titulo || item.livro }}
          </li>
        </ul>

        <!-- Linha separadora -->
        <hr class="divisor-reserva" />

        <!-- Datas da reserva -->
        <div class="datas-reserva">
          <p v-if="reserva.data_criacao">
            <strong>Data da reserva:</strong>
            {{ formatarData(reserva.data_criacao) }}
          </p>

          <p v-if="reserva.data_retirada">
            <strong>Data de retirada:</strong>
            {{ formatarData(reserva.data_retirada) }}
          </p>

          <p v-if="reserva.data_devolucao_prevista">
            <strong>Devolução prevista:</strong>
            {{ formatarData(reserva.data_devolucao_prevista) }}
          </p>

          <p v-if="reserva.data_devolucao">
            <strong>Data de devolução:</strong>
            {{ formatarData(reserva.data_devolucao) }}
          </p>
        </div>

        <!-- Botões existentes -->
        <button v-if="['reservado'].includes(reserva.status?.toLowerCase())" class="btn-cancelar"
          @click="cancelarReserva(reserva.id)">
          Cancelar reserva
        </button>

        <button v-if="authStore.user?.is_superuser && reserva.status?.toLowerCase() === 'reservado'"
          class="btn-status btn-retirada" @click="registrarRetirada(reserva.id)">
          Registrar retirada
        </button>

        <button v-if="authStore.user?.is_superuser && reserva.status?.toLowerCase() === 'retirado'"
          class="btn-status btn-devolucao" @click="registrarDevolucao(reserva.id)">
          Registrar devolução
        </button>

      </div>
    </div>

    <div class="paginator" v-if="reservaStore.meta.total_pages > 1">
      <button class="btn btn-outline btn-sm" :disabled="reservaStore.meta.page == 1"
        @click="reservaStore.paginaAnterior">
        Anterior
      </button>

      <span>
        Página {{ reservaStore.meta.page }}
        de {{ reservaStore.meta.total_pages }}
      </span>

      <button class="btn btn-outline btn-sm" :disabled="reservaStore.meta.page == reservaStore.meta.total_pages
        " @click="reservaStore.proximaPagina">
        Próxima
      </button>
    </div>
  </div>

  <div v-if="mostrarPopupCancelar" class="popup-overlay" @click.self="fecharPopupCancelar">
    <div class="popup-confirmacao">

      <h2>Cancelar reserva</h2>

      <p>
        Tem certeza que deseja cancelar esta reserva?
      </p>

      <div class="popup-acoes">
        <button class="btn-popup btn-volta" @click="fecharPopupCancelar">
          Voltar
        </button>

        <button class="btn-popup btn-confirmar" @click="confirmarCancelamento">
          Cancelar reserva
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.usuario-info {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: white;
}

.reserva-itens {
  list-style: none;
  padding: 0;
  margin: 0;
  color: white;
}

.reserva-itens li {
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.divisor-reserva {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.4);
  margin: 0.75rem 0;
}

.datas-reserva {
  color: white;
  font-size: 0.875rem;
}

.datas-reserva p {
  margin: 0.4rem 0;
}

.btn-status {
  margin-top: 1rem;
  margin-right: 0.5rem;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-status:hover {
  opacity: 0.85;
}

.btn-retirada {
  background-color: #198754;
}

.btn-devolucao {
  background-color: #0d6efd;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-voltar {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  margin-bottom: 24px;
}

.btn-voltar:hover {
  transform: translateX(-3px);
  opacity: 0.85;
}

.reservas-list {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reserva-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reserva-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin-bottom: 0.5rem;
  color: white;
}

.card {
  background-color: var(--primary);
}

.btn-cancelar {
  margin-top: 1rem;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #dc3545;
  color: white;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancelar:hover {
  background-color: #bb2d3b;
}

.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.popup-confirmacao {
  width: 90%;
  max-width: 420px;
  background: var(--primary);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.popup-confirmacao h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: white;
}

.popup-confirmacao p {
  color: white;
  margin-bottom: 1.5rem;
}

.popup-acoes {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-popup {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-voltar {
  background: #6c757d;
  color: white;
}

.btn-voltar:hover {
  background: #5a6268;
}

.btn-volta {
  background: #6c757d;
  color: white;
}

.btn-volta:hover {
  background: #5a6268;
}

.btn-confirmar {
  background: #dc3545;
  color: white;
}

.btn-confirmar:hover {
  background: #bb2d3b;
}

.page {
  min-height: 100vh;
  height: auto;
  overflow-y: visible;
  padding-bottom: 40px;
}

.reserva-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin-bottom: 0.5rem;
  color: white;
}

.usuario-info span {
  display: block;
}
</style>