<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import LivrosApi from '@/api/livros'
import AutorApi from '@/api/autor'
import EditoraApi from '@/api/editora'
import CategoriaApi from '@/api/categoria'
import { useLivroStore } from '@/stores/livro'
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const livroStore = useLivroStore()
const toast = useToastStore()
const mostrarAutores = ref(false)
const livrosApi = new LivrosApi()
const autorApi = new AutorApi()
const editoraApi = new EditoraApi()
const categoriaApi = new CategoriaApi()
const router = useRouter();
const authStore = useAuthStore();
const mostrarModalCadastro = ref(false)
const tipoCadastro = ref('')
const nomeNovoCadastro = ref('')
const salvandoCadastro = ref(false)

const tiposCadastro = {
  categoria: {
    titulo: 'Adicionar categoria',
    campo: 'descricao'
  },
  editora: {
    titulo: 'Adicionar editora',
    campo: 'nome'
  },
  autor: {
    titulo: 'Adicionar autor',
    campo: 'nome'
  }
}

function voltarInicio() {
  if (authStore.isAdmin) {
    router.push({ name: 'admin' });
  } else {
    router.push({ name: 'livros' });
  }
}

const defaultLivro = {
  id: null,
  titulo: '',
  capa: '',
  capa_attachment_key: '',
  isbn: '',
  formato: '',
  categoria: '',
  autores: [],
  editora: '',
  quantidade: 1,
  sinopse: ''
}

const livro = reactive({
  ...defaultLivro
})

const autores = ref([])
const editoras = ref([])
const categorias = ref([])
const formatos = ref(['Livro', 'Revista', 'Apostila', 'Manual', 'Norma técnica'])
const busca = ref('')
const capaArquivo = ref(null)
const capaPreview = ref('')

let buscaTimer = null


function capaUrl(capa) {
  return capa?.url || ''
}


async function carregarOpcoes() {
  try {
    const [
      autoresData,
      editorasData,
      categoriasData
    ] = await Promise.all([
      autorApi.buscarTodosOsAutores(1),
      editoraApi.buscarTodasAsEditoras(1),
      categoriaApi.buscarTodasAsCategorias(1)
    ])

    autores.value =
      autoresData.results || autoresData

    editoras.value =
      editorasData.results || editorasData

    const categoriasCarregadas = [
      ...(categoriasData.results || categoriasData)
    ]

    const totalPaginas = categoriasData.total_pages || 1

    for (let pagina = 2; pagina <= totalPaginas; pagina++) {
      const resposta = await categoriaApi.buscarTodasAsCategorias(pagina)

      categoriasCarregadas.push(
        ...(resposta.results || resposta)
      )
    }

    categorias.value = categoriasCarregadas

  } catch (error) {
    console.error(
      'Erro ao carregar opções:',
      error
    )

    toast.showToast(
      'Erro ao carregar autores, editoras ou categorias.',
      'error'
    )
  }
}

function abrirModalCadastro(tipo) {
  tipoCadastro.value = tipo
  nomeNovoCadastro.value = ''
  mostrarModalCadastro.value = true
  mostrarAutores.value = false
}

function fecharModalCadastro() {
  mostrarModalCadastro.value = false
  nomeNovoCadastro.value = ''
}

async function salvarCadastroRapido() {
  const tipo = tipoCadastro.value
  const configuracao = tiposCadastro[tipo]
  const nome = nomeNovoCadastro.value.trim()

  if (!configuracao || !nome) {
    toast.showToast('Informe o nome antes de salvar.', 'error')
    return
  }

  if (salvandoCadastro.value) return

  salvandoCadastro.value = true

  try {
    const dados = {
      [configuracao.campo]: nome
    }

    let novoRegistro

    if (tipo === 'categoria') {
      novoRegistro = await categoriaApi.adicionarCategoria(dados)
    } else if (tipo === 'editora') {
      novoRegistro = await editoraApi.adicionarEditora(dados)
    } else if (tipo === 'autor') {
      novoRegistro = await autorApi.adicionarAutor(dados)
    } else {
      throw new Error('Tipo de cadastro inválido.')
    }

    if (!novoRegistro?.id) {
      throw new Error('A API não retornou o registro criado com seu ID.')
    }

    if (tipo === 'categoria') {
      categorias.value.push(novoRegistro)
      livro.categoria = novoRegistro.id
    } else if (tipo === 'editora') {
      editoras.value.push(novoRegistro)
      livro.editora = novoRegistro.id
    } else {
      autores.value.push(novoRegistro)

      if (!livro.autores.includes(novoRegistro.id)) {
        livro.autores.push(novoRegistro.id)
      }
    }

    fecharModalCadastro()

    toast.showToast(
      `${configuracao.titulo.replace('Adicionar ', '')} cadastrada com sucesso!`
    )
  } catch (error) {
    console.error(
      'Erro ao cadastrar opção:',
      error.response?.data || error
    )

    const mensagem =
      error.response?.data?.detail ||
      error.response?.data?.descricao?.[0] ||
      error.response?.data?.nome?.[0] ||
      error.message ||
      'Não foi possível cadastrar.'

    toast.showToast(mensagem, 'error')
  } finally {
    salvandoCadastro.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    livroStore.getLivros(),
    carregarOpcoes()
  ])
})


onUnmounted(() => {
  clearTimeout(buscaTimer)

  if (capaPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(capaPreview.value)
  }
})


function onBusca() {
  clearTimeout(buscaTimer)

  buscaTimer = setTimeout(() => {
    livroStore.getLivros(
      1,
      busca.value
    )
  }, 400)
}

function selecionarCapa(event) {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  const tiposPermitidos = [
    'image/jpeg',
    'image/png'
  ]

  if (!tiposPermitidos.includes(file.type)) {
    toast.showToast(
      'A capa deve ser uma imagem JPG ou PNG.',
      'error'
    )

    event.target.value = ''
    return
  }

  if (capaPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(
      capaPreview.value
    )
  }

  capaArquivo.value = file

  capaPreview.value =
    URL.createObjectURL(file)
}

function limpar() {
  if (capaPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(
      capaPreview.value
    )
  }

  Object.assign(
    livro,
    { ...defaultLivro }
  )

  capaArquivo.value = null
  capaPreview.value = ''

  const input =
    document.getElementById('livro-capa')

  if (input) {
    input.value = ''
  }
}

async function salvar() {
  try {

    if (!livro.titulo) {
      toast.showToast(
        'Informe o título do livro.',
        'error'
      )

      return
    }

    if (!livro.autores || livro.autores.length === 0) {
      toast.showToast('Selecione pelo menos um autor.', 'error')
      return
    }

    if (!livro.editora) {
      toast.showToast(
        'Selecione uma editora.',
        'error'
      )

      return
    }

    if (!livro.categoria) {
      toast.showToast(
        'Selecione uma categoria.',
        'error'
      )

      return
    }

    if (capaArquivo.value) {

      const imagem =
        await livrosApi.uploadCapa(
          capaArquivo.value
        )

      livro.capa_attachment_key =
        imagem.attachment_key
    }


    const dadosLivro = {
      ...livro
    }

    delete dadosLivro.capa

    if (!dadosLivro.capa_attachment_key && !capaArquivo.value) {
      delete dadosLivro.capa_attachment_key
    }

    await livroStore.salvarLivro(
      dadosLivro
    )


    toast.showToast(
      livro.id
        ? 'Livro atualizado!'
        : 'Livro criado!'
    )


    limpar()

  } catch (error) {

    console.error(
      'ERRO AO SALVAR LIVRO:',
      error.response?.data
    )

    const mensagem =
      error.response?.data?.detail ||
      error.response?.data?.titulo?.[0] ||
      error.response?.data?.autor?.[0] ||
      error.response?.data?.editora?.[0] ||
      error.response?.data?.categoria?.[0] ||
      error.response?.data?.isbn?.[0] ||
      error.response?.data?.capa_attachment_key?.[0] ||
      error.response?.data?.file?.[0] ||
      'Erro ao salvar livro.'

    toast.showToast(
      mensagem,
      'error'
    )
  }
}


async function editar(l) {
  try {
    const dados = await livrosApi.buscarLivro(l.id)

    const obterId = (valor) => {
      if (valor == null) return ''
      if (typeof valor === 'object') return valor.id ?? ''
      return valor
    }

    Object.assign(livro, {
      ...defaultLivro,
      ...dados,

      id: dados.id,
      titulo: dados.titulo ?? '',
      isbn: dados.isbn ?? '',
      formato: dados.formato ?? '',
      sinopse: dados.sinopse ?? '',
      quantidade: dados.quantidade ?? 1,

      autores: Array.isArray(dados.autores)
        ? dados.autores.map(autor => obterId(autor))
        : [],

      editora: obterId(dados.editora),
      categoria: obterId(dados.categoria),

      capa_attachment_key:
        dados.capa_attachment_key ?? ''
    })

    capaArquivo.value = null
    capaPreview.value = capaUrl(dados.capa)

    const input = document.getElementById('livro-capa')
    if (input) input.value = ''

    mostrarAutores.value = false

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } catch (error) {
    console.error(
      'Erro ao carregar dados do livro:',
      error.response?.data || error
    )

    toast.showToast(
      'Não foi possível carregar os dados completos do livro.',
      'error'
    )
  }
}

</script>

<template>

  <div class="page">

    <div class="page-header">
      <button class="btn-voltar" @click="voltarInicio" title="Voltar">
        &lt;
      </button>

      <h1 class="page-title">
        Livros
      </h1>
    </div>

    <div class="form-row">

      <div class="form-group">

        <label class="label" for="livro-titulo">
          Título
        </label>

        <input class="input-livro" id="livro-titulo" type="text" v-model="livro.titulo" />

      </div>

      <div class="form-group">

        <label class="label" for="livro-isbn">
          ISBN
        </label>

        <input class="input-isbn" id="livro-isbn" type="text" v-model="livro.isbn" />

      </div>

      <div class="form-group">
        <label class="label" for="livro-formato">Formato:</label>
        <select id="livro-formato" v-model="livro.formato" class="input-formato">
          <option v-for="formato in formatos" :key="formato" :value="formato">
            {{ formato }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">Autores</label>

        <div class="campo-com-adicionar">
          <div class="autores-dropdown">
            <button type="button" class="autores-select" @click="mostrarAutores = !mostrarAutores">
              <span v-if="!livro.autores.length">
                Selecione os autores
              </span>

              <span v-else>
                {{ livro.autores.length }} autor(es) selecionado(s)
              </span>

              <span style="margin-left: 6px;">▾</span>
            </button>

            <div v-if="mostrarAutores" class="autores-lista">
              <label v-for="autor in autores" :key="autor.id" class="autor-option">
                <input type="checkbox" :value="autor.id" v-model="livro.autores" />

                <span>{{ autor.nome }}</span>
              </label>
            </div>
          </div>

          <button type="button" class="btn-adicionar-opcao" title="Adicionar autor" aria-label="Adicionar autor"
            @click="abrirModalCadastro('autor')">
            +
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="label" for="livro-editora">
          Editora
        </label>

        <div class="campo-com-adicionar">
          <select id="livro-editora" class="input-editora" v-model="livro.editora">
            <option value="" disabled>
              Selecione uma editora
            </option>

            <option v-for="editora in editoras" :key="editora.id" :value="editora.id">
              {{ editora.nome }}
            </option>
          </select>

          <button type="button" class="btn-adicionar-opcao" title="Adicionar editora" aria-label="Adicionar editora"
            @click="abrirModalCadastro('editora')">
            +
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="label" for="livro-categoria">
          Categoria
        </label>

        <div class="campo-com-adicionar">
          <select id="livro-categoria" class="input-categoria" v-model="livro.categoria">
            <option value="" disabled>
              Selecione uma categoria
            </option>

            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.descricao }}
            </option>
          </select>

          <button type="button" class="btn-adicionar-opcao" title="Adicionar categoria" aria-label="Adicionar categoria"
            @click="abrirModalCadastro('categoria')">
            +
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="label" for="livro-quantidade">
          Quantidade
        </label>

        <input class="input-quantidade" id="livro-quantidade" type="number" min="0" step="1"
          v-model.number="livro.quantidade" />
      </div>

      <div class="form-group">
        <label class="label" for="livro-sinopse">
          Sinopse
        </label>

        <textarea class="input-sinopse" id="livro-sinopse" v-model="livro.sinopse"
          placeholder="Digite a sinopse do livro..." rows="4"></textarea>
      </div>

      <div class="form-group">

        <label class="label" for="livro-capa">
          Capa
        </label>

        <input class="input-arquivo" id="livro-capa" type="file" accept="image/jpeg,image/png"
          @change="selecionarCapa" />

        <label v-if="!capaArquivo" for="livro-capa" class="upload-btn">
          Escolher arquivo
        </label>

        <img v-if="capaPreview" :src="capaPreview" alt="Capa do livro" class="livro-capa-preview" />

      </div>

      <button class="btn" @click="salvar">
        {{ livro.id ? 'Atualizar' : 'Salvar' }}
      </button>

      <button class="btn btn-outline" @click="limpar">
        Limpar
      </button>

    </div>

    <div v-if="mostrarModalCadastro" class="modal-overlay" @click.self="fecharModalCadastro">
      <div class="modal-cadastro" role="dialog" aria-modal="true" :aria-label="tiposCadastro[tipoCadastro]?.titulo">
        <div class="modal-cadastro-header">
          <h2>{{ tiposCadastro[tipoCadastro]?.titulo }}</h2>

          <button type="button" class="modal-fechar" title="Fechar" @click="fecharModalCadastro">
            &times;
          </button>
        </div>

        <form @submit.prevent="salvarCadastroRapido">
          <label for="novo-cadastro-nome">
            Nome
          </label>

          <input id="novo-cadastro-nome" v-model="nomeNovoCadastro" type="text" maxlength="255" required autofocus
            placeholder="Digite o nome" />

          <div class="modal-cadastro-acoes">
            <button type="button" class="btn btn-outline" :disabled="salvandoCadastro" @click="fecharModalCadastro">
              Cancelar
            </button>

            <button type="submit" class="btn-adicionar-opcao btn-salvar-modal" :disabled="salvandoCadastro">
              {{ salvandoCadastro ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="search-wrapper">

      <input class="search-input" type="text" v-model="busca" @input="onBusca" placeholder="Buscar livros..." />

      <button v-if="busca" class="search-clear" @click="
        busca = '';
      onBusca()
        ">
        &times;
      </button>

    </div>

    <div v-if="!livroStore.livros.length" class="empty-state">
      Nenhum livro cadastrado.
    </div>

    <ul class="list" v-else>

      <li class="list-item" v-for="l in livroStore.livros" :key="l.id">

        <img v-if="l.capa" :src="capaUrl(l.capa)" alt="Capa" class="livro-capa-lista" />

        <span>
          ({{ l.id }}) — {{ l.titulo }}
        </span>

        <div class="list-item-actions">

          <button class="btn btn-outline btn-sm btn-icon-sm" @click="editar(l)" title="Editar">
            ✎
          </button>

        </div>

      </li>

    </ul>

    <div class="paginator">

      <button class="btn btn-outline btn-sm" :disabled="livroStore.meta.page == 1
        " @click="
          livroStore.paginaAnterior
        ">
        Anterior
      </button>


      <button class="btn btn-outline btn-sm" :disabled="livroStore.meta.page ==
        livroStore.meta.total_pages
        " @click="
          livroStore.proximaPagina
        ">
        Próxima
      </button>


      <span>
        Página {{ livroStore.meta.page }}
        de
        {{ livroStore.meta.total_pages }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Campo de seleção com botão + */
.campo-com-adicionar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.campo-com-adicionar>select {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.campo-com-adicionar .autores-dropdown {
  flex: 1;
  min-width: 0;
}

/* Botão verde no estilo da imagem */
.btn-adicionar-opcao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #35ad45;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.btn-adicionar-opcao:hover {
  background-color: rgba(53, 173, 69, 0.12);
  color: #49d15b;
}

.btn-adicionar-opcao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Janela modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.65);
}

.modal-cadastro {
  width: 100%;
  max-width: 420px;
  padding: 22px;
  border: 1px solid var(--secondary);
  border-radius: 10px;
  background: var(--background);
  color: var(--text);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
}

.modal-cadastro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-cadastro-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-fechar {
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 28px;
  cursor: pointer;
}

.modal-cadastro form>label {
  display: block;
  margin-bottom: 8px;
}

.modal-cadastro form>input {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--secondary);
  border-radius: 6px;
  background: var(--background);
  color: var(--text);
  font: inherit;
}

.modal-cadastro-acoes {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
}

.btn-salvar-modal {
  flex: 0 0 auto;
  width: auto;
  min-width: 85px;
  height: 38px;
  padding: 0 16px;
  border-radius: 6px;
  background: #35ad45;
  color: #fff;
  font-size: 14px;
}

.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-voltar {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  padding: 0;
  margin: 0;
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
}

.btn-voltar:hover {
  transform: translateX(-3px);
  opacity: 0.85;
}

.page-title {
  margin: 0;
}

.input-sinopse {
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid var(--secondary);
  border-radius: calc(var(--radius) - 2px);
  background-color: var(--background);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.input-sinopse::placeholder {
  color: var(--text);
  opacity: 0.6;
}

.input-quantidade {
  border: 1px solid var(--secondary);
}

.input-arquivo {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 10px 16px;
  background-color: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.upload-btn:hover {
  background-color: #2563eb;
}

.livro-capa-preview {
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  margin-top: 10px;
}

input[type="file"]::file-selector-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
  transition: background-color 0.2s ease;
}

input[type="file"]::file-selector-button:hover {
  background-color: #2563eb;
}

.livro-capa-lista {
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.btn.btn-outline.btn-sm {
  border: 1px solid var(--secondary);
  cursor: pointer;
}


.btn.btn-outline.btn-sm:disabled {
  cursor: not-allowed;
}


.list-item {
  border-bottom: 1px solid var(--secondary);
}


.btn.btn-outline {
  border: 1px solid var(--secondary);
}


.input-livro {
  border: 1px solid var(--secondary);
}


.input-isbn {
  border: 1px solid var(--secondary);
}


.input-categoria {
  border: 1px solid var(--secondary);
}


.input-autor {
  border: 1px solid var(--secondary);
}


.input-editora {
  border: 1px solid var(--secondary);
}

select {
  background-color: var(--background);
  color: var(--text);
  border: 1px solid var(--secondary);
}

select option {
  background-color: var(--background);
  color: var(--text);
}

.input-autor {
  border: 1px solid var(--secondary);
  background-color: #222;
  color: #fff;
  min-height: 100px;
}

.input-autor option {
  background-color: #222;
  color: #fff;
  padding: 8px;
}

.autores-dropdown {
  position: relative;
  width: 100%;
}

.autores-select {
  width: 100%;
  min-height: 37px;
  padding: 8px 12px;
  background: #232e3c;
  color: #fff;
  border: 1px solid var(--secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  border-radius: calc(var(--radius) - 2px);
}

.autores-lista {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  background: #232e3c;
  border: 1px solid var(--secondary);
  z-index: 100;
}

.autor-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #fff;
  cursor: pointer;
}

.autor-option:hover {
  background: #333;
}

.autor-option input {
  cursor: pointer;
}
</style>