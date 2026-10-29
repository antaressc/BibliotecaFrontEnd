import { ref } from "vue";
import { defineStore } from "pinia";

import UsuariosApi from "@/api/usuarios";

export const useUsuarioStore = defineStore("usuario", () => {
  const usuarios = ref([]);

  const meta = ref({
    page: 1,
    total_pages: 1,
  });

  const usuariosApi = new UsuariosApi();

  async function getUsuarios(page = 1, search = "") {
    const data = await usuariosApi.buscarTodosOsUsuarios(page, search);
  
    usuarios.value = Array.isArray(data)
      ? data
      : data.results || [];
  
    meta.value = {
      page: 1,
      total_pages: 1,
    };
  
    return data;
  }

  async function salvarUsuario(usuario) {
    let data;

    if (usuario.id) {
      data = await usuariosApi.atualizarUsuario(usuario);
    } else {
      data = await usuariosApi.adicionarUsuario(usuario);
    }

    await getUsuarios(meta.value.page);

    return data;
  }

  async function excluirUsuario(id) {
    await usuariosApi.excluirUsuario(id);

    await getUsuarios(meta.value.page);
  }

  async function paginaAnterior() {
    if (meta.value.page > 1) {
      await getUsuarios(meta.value.page - 1);
    }
  }

  async function proximaPagina() {
    if (meta.value.page < meta.value.total_pages) {
      await getUsuarios(meta.value.page + 1);
    }
  }

  return {
    usuarios,
    meta,
    getUsuarios,
    salvarUsuario,
    excluirUsuario,
    paginaAnterior,
    proximaPagina,
  };
});