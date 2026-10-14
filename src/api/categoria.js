import axios from "axios";
export default class CategoriaApi {
  async buscarTodasAsCategorias(page = 1, search = "") {
    const { data } = await axios.get("/categorias/", {
      params: {
        page,
        search: search.trim()
      }
    });

    return data;
  }
  async adicionarCategoria(categoria) {
    const { data } = await axios.post('/categorias/', categoria);
    return data;
  }
  async atualizarCategoria(categoria) {
    const { data } = await axios.put(`/categorias/${categoria.id}/`, categoria);
    return data;
  }
  async excluirCategoria(id) {
    await axios.delete(`/categorias/${id}/`);
  }
}
