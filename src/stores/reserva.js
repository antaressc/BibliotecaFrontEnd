import { ref } from 'vue'
import { defineStore } from 'pinia'
import ReservaApi from '@/api/reserva'

const reservaApi = new ReservaApi()

export const useReservaStore = defineStore('reserva', () => {
  const reservas = ref([])

  const reservaAtual = ref(null)

  const loading = ref(false)

  const meta = ref({
    page: 1,
    page_size: 0,
    total_pages: 0
  })

  async function criarReserva(livroId) {
    const itens = [
      {
        livro: livroId
      }
    ]

    const data = await reservaApi.criarReserva(itens)

    reservaAtual.value = data

    await getReservas(meta.value.page || 1)

    return data
  }

  async function getReservas(page = 1) {
    loading.value = true

    try {
      const data = await reservaApi.buscarReservas(page)

      reservas.value = data.results

      meta.value.page = data.page
      meta.value.page_size = data.page_size
      meta.value.total_pages = data.total_pages
    } finally {
      loading.value = false
    }
  }

  async function getReserva(id) {
    loading.value = true

    try {
      reservaAtual.value = await reservaApi.buscarReserva(id)
    } finally {
      loading.value = false
    }
  }

  async function proximaPagina() {
    if (meta.value.page < meta.value.total_pages) {
      await getReservas(meta.value.page + 1)
    }
  }

  async function paginaAnterior() {
    if (meta.value.page > 1) {
      await getReservas(meta.value.page - 1)
    }
  }

  async function cancelarReserva(id) {
    const data = await reservaApi.cancelarReserva(id)

    await getReservas(meta.value.page || 1)

    return data
  }


  async function registrarRetirada(id) {
    const data = await reservaApi.registrarRetirada(id)

    await getReservas(meta.value.page || 1)

    return data
  }

  async function registrarDevolucao(id) {
    const data = await reservaApi.registrarDevolucao(id)

    await getReservas(meta.value.page || 1)

    return data
  }


  return {
    reservas,
    reservaAtual,
    loading,
    meta,

    getReservas,
    getReserva,
    criarReserva,
    cancelarReserva,
    registrarRetirada,
    registrarDevolucao,
    proximaPagina,
    paginaAnterior
  }
})