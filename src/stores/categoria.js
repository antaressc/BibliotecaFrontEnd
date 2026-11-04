import { ref } from 'vue'
import { defineStore } from 'pinia'

import CategoriaApi from '@/api/categoria'

const categoriaApi = new CategoriaApi()

export const useCategoriaStore = defineStore('categoria', () => {
  const categorias = ref([])
  const meta = ref({
    page: 0,
    page_size: 0,
    total_pages: 0
  })

  const currentSearch = ref('')

  
  async function getCategorias(page = 1, search = '') {
    currentSearch.value = search
  
    const primeiraPagina = await categoriaApi.buscarTodasAsCategorias(1, search)
    const todasAsCategorias = [...primeiraPagina.results]
  
    const totalPaginas = primeiraPagina.total_pages || 1
  
    if (totalPaginas > 1) {
      const requisicoes = []
    
      for (let pagina = 2; pagina <= totalPaginas; pagina++) {
        requisicoes.push(
          categoriaApi.buscarTodasAsCategorias(pagina, search)
        )
      }
    
      const resultados = await Promise.all(requisicoes)
    
      for (const resultado of resultados) {
        todasAsCategorias.push(...resultado.results)
      }
    }
  
    categorias.value = todasAsCategorias
  
    meta.value.page = primeiraPagina.page
    meta.value.page_size = primeiraPagina.page_size
    meta.value.total_pages = totalPaginas
  }

  async function search(text) {
    await getCategorias(1, text)
  }

  async function excluirCategoria(id) {
    await categoriaApi.excluirCategoria(id)
    const index = categorias.value.findIndex((categoria) => categoria.id === id)
    categorias.value.splice(index, 1)
  }

  async function salvarCategoria(categoria) {
    if (categoria.id) {
      await categoriaApi.atualizarCategoria(categoria)
      const index = categorias.value.findIndex((c) => c.id === categoria.id)
      categorias.value.splice(index, 1, categoria)
    } else {
      const data = await categoriaApi.adicionarCategoria(categoria)
      categorias.value.splice(0, 0, data)
    }
  }

  async function proximaPagina() {
    await getCategorias(meta.value.page + 1, currentSearch.value)
  }

  async function paginaAnterior() {
    await getCategorias(meta.value.page - 1, currentSearch.value)
  }

  return {
    categorias,
    meta,
    getCategorias,
    salvarCategoria,
    excluirCategoria,
    search,
    proximaPagina,
    paginaAnterior
  }
})
