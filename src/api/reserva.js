import axios from "axios"

export default class ReservaApi {
  async buscarReservas(page = 1) {
    const { data } = await axios.get(`/reservas/?page=${page}`)
    return data
  }

  async buscarReserva(id) {
    const { data } = await axios.get(`/reservas/${id}/`)
    return data
  }

  async criarReserva(itens) {
    const { data } = await axios.post("/reservas/", { itens })
    return data
  }

  async atualizarReserva(id, itens) {
    const { data } = await axios.put(`/reservas/${id}/`, { itens })
    return data
  }

  async cancelarReserva(id) {
    const { data } = await axios.post(`/reservas/${id}/cancelar/`)
    return data
  }

  async registrarRetirada(id) {
    const { data } = await axios.post(`/reservas/${id}/retirar/`)
    return data
  }

  async registrarDevolucao(id) {
    const { data } = await axios.post(`/reservas/${id}/devolver/`)
    return data
  }

}