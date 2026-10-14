import axios from "axios";

export default class UsuariosApi {

  async buscarTodosOsUsuarios(page = 1, search = "") {
    const { data } = await axios.get("/usuarios/", {
      params: {
        page,
        search: search.trim()
      }
    });

    return data;
  }


  async buscarUsuario(id) {
    const { data } = await axios.get(`/usuarios/${id}/`);
    return data;
  }

  async adicionarUsuario(usuario) {
    const { data } = await axios.post(
      "/usuarios/",
      usuario
    );

    return data;
  }

  async atualizarUsuario(usuario) {
    const { data } = await axios.put(
      `/usuarios/${usuario.id}/`,
      usuario
    );

    return data;
  }

  async excluirUsuario(id) {
    await axios.delete(`/usuarios/${id}/`);
  }
}