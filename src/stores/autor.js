import { ref } from 'vue'
import { defineStore } from 'pinia'

import AutorApi from '@/api/autor'

const autorApi = new AutorApi()

export const useAutorStore = defineStore('autor', () => {
  const autores = ref([])
  const meta = ref({
    page: 0,
    page_size: 0,
    total_pages: 0
  })

  const currentSearch = ref('')

  async function getAutores(page = 1, search = '') {
    currentSearch.value = search

    const primeiraPagina = await autorApi.buscarTodosOsAutores(1, search)
    const todosOsAutores = [...primeiraPagina.results]

    const totalPaginas = primeiraPagina.total_pages || 1

    if (totalPaginas > 1) {
      const requisicoes = []

      for (let pagina = 2; pagina <= totalPaginas; pagina++) {
        requisicoes.push(
          autorApi.buscarTodosOsAutores(pagina, search)
        )
      }

      const resultados = await Promise.all(requisicoes)

      for (const resultado of resultados) {
        todosOsAutores.push(...resultado.results)
      }
    }

    autores.value = todosOsAutores

    meta.value.page = primeiraPagina.page
    meta.value.page_size = primeiraPagina.page_size
    meta.value.total_pages = totalPaginas
  }

  async function search(text) {
    await getAutores(1, text)
  }

  async function excluirAutor(id) {
    await autorApi.excluirAutor(id)
    const index = autores.value.findIndex((autor) => autor.id === id)
    autores.value.splice(index, 1)
  }

  async function salvarAutor(autor) {
    if (autor.id) {
      await autorApi.atualizarAutor(autor)
      const index = autores.value.findIndex((a) => a.id === autor.id)
      autores.value.splice(index, 1, autor)
    } else {
      const data = await autorApi.adicionarAutor(autor)
      autores.value.splice(0, 0, data)
    }
  }

  async function proximaPagina() {
    await getAutores(meta.value.page + 1, currentSearch.value)
  }

  async function paginaAnterior() {
    await getAutores(meta.value.page - 1, currentSearch.value)
  }

  return {
    autores,
    meta,
    getAutores,
    search,
    salvarAutor,
    excluirAutor,
    proximaPagina,
    paginaAnterior
  }
})
