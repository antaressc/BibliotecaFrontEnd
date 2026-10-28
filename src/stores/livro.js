import { ref } from 'vue'
import { defineStore } from 'pinia'
import LivrosApi from '@/api/livros'

export const useLivroStore = defineStore('livro', () => {
  const livros = ref([])
  const loading = ref(false)
  const meta = ref({
    page: 0,
    page_size: 0,
    total_pages: 0
  })

  const livrosApi = new LivrosApi()
  const currentSearch = ref('')
  const currentAutor = ref('')
  const currentCategoria = ref('')
  const formatos = ref([]);

  async function getFormatos() {
    formatos.value = await livrosApi.buscarFormatos();
  }

  async function getLivros(
    page = 1,
    search = '',
    autor = '',
    categoria = '',
    formato = ''
  ) {
    currentSearch.value = search;
    currentAutor.value = autor;
    currentCategoria.value = categoria;

    loading.value = true;

    try {
      const data = await livrosApi.buscarTodosOsLivros(
        page,
        search,
        autor,
        categoria,
        formato
      );

      livros.value = data.results;
      meta.value.page = data.page;
      meta.value.page_size = data.page_size;
      meta.value.total_pages = data.total_pages;
    } finally {
      loading.value = false;
    }
  }

  async function search(text) {
    await getLivros(
      1,
      text,
      currentAutor.value,
      currentCategoria.value
    )
  }

  async function excluirLivro(id) {
    await livrosApi.excluirLivro(id)

    const index = livros.value.findIndex(
      (livro) => livro.id === id
    )

    if (index !== -1) {
      livros.value.splice(index, 1)
    }
  }

  async function salvarLivro(livro) {
    if (livro.id) {
      const data = await livrosApi.atualizarLivro(livro)

      const index = livros.value.findIndex(
        (l) => l.id === livro.id
      )

      livros.value.splice(index, 1, data)
    } else {
      const data = await livrosApi.adicionarLivro(livro)

      livros.value.splice(0, 0, data)
    }
  }

  async function proximaPagina() {
    await getLivros(
      meta.value.page + 1,
      currentSearch.value,
      currentAutor.value,
      currentCategoria.value
    )
  }

  async function paginaAnterior() {
    await getLivros(
      meta.value.page - 1,
      currentSearch.value,
      currentAutor.value,
      currentCategoria.value
    )
  }

  async function irParaPagina(pagina) {
    if (pagina < 1 || pagina > meta.value.total_pages) {
      return
    }

    await getLivros(
      pagina,
      currentSearch.value,
      currentAutor.value,
      currentCategoria.value
    )
  }

  return {
    livros,
    loading,
    meta,

    currentSearch,
    currentAutor,
    currentCategoria,

    getLivros,
    search,
    salvarLivro,
    excluirLivro,
    proximaPagina,
    paginaAnterior,
    irParaPagina,
    formatos,
    getFormatos,
  }
})