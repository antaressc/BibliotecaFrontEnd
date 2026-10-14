import axios from "axios";
export default class EditoraApi {

  async buscarTodasAsEditoras(page = 1, search = "") {
    const { data } = await axios.get("/editoras/", {
      params: {
        page,
        search: search.trim()
      }
    });
    return data;
  }

  async adicionarEditora(editora) {
    const { data } = await axios.post("/editoras/", editora);
    return data;
  }
  async atualizarEditora(editora) {
    const { data } = await axios.put(`/editoras/${editora.id}/`, editora);
    return data;
  }
  async excluirEditora(id) {
    await axios.delete(`/editoras/${id}/`);
  }
}
