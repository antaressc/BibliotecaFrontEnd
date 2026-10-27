<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import ModalAdicionarLivro from "../components/livros/ModalAdicionarLivro.vue";
import { useLivroStore } from "@/stores/livro";
import { useReservaStore } from "@/stores/reserva";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { useCategoriaStore } from "@/stores/categoria";
import { useAutorStore } from "@/stores/autor";

const livroStore = useLivroStore();
const reservaStore = useReservaStore();
const authStore = useAuthStore();
const toast = useToastStore();
const canManage = computed(() => authStore.canManage);
const showModal = ref(false);
const livroParaEditar = ref(null);
const busca = ref('');
const autor = ref('');
const categoria = ref('');
let buscaTimer = null;
const livroSinopse = ref(null);
const categoriaStore = useCategoriaStore();
const autorStore = useAutorStore();
const formato = ref('');

onMounted(async () => {
  try {
    await Promise.all([
      livroStore.getLivros(),
      categoriaStore.getCategorias(),
      autorStore.getAutores(),
      livroStore.getFormatos()
    ])
  } catch (error) {
    console.error('ERRO AO CARREGAR DADOS:', error)
    toast.showToast(
      'Erro ao carregar livros, categorias ou autores.',
      'error'
    )
  }
})

onUnmounted(() => {
  clearTimeout(buscaTimer);
});

function aplicarFiltros() {
  clearTimeout(buscaTimer);

  buscaTimer = setTimeout(() => {
    livroStore.getLivros(
      1,
      busca.value,
      autor.value,
      categoria.value,
      formato.value
    );
  }, 400);
}

function limparFiltros() {
  busca.value = '';
  autor.value = '';
  categoria.value = '';
  formato.value = '';

  livroStore.getLivros(1);
}

function abrirModal() {
  livroParaEditar.value = null;
  showModal.value = true;
}

async function reservarLivro(livroId) {
  try {
    await reservaStore.criarReserva(livroId)

    mostrarPopup(
      'Livro reservado com sucesso!',
      'sucesso'
    )
  } catch (error) {
    const data = error.response?.data

    const mensagem = Array.isArray(data)
      ? data[0]
      : data?.detail ||
      data?.non_field_errors?.[0] ||
      data?.message ||
      'Erro ao reservar o livro.'

    mostrarPopup(mensagem, 'erro')
  }
}

async function aoSalvar() {
  showModal.value = false;
  toast.showToast('Livro salvo!');

  await livroStore.getLivros(
    livroStore.meta.page,
    livroStore.currentSearch,
    livroStore.currentAutor,
    livroStore.currentCategoria,
    formato.value
  );
}

function capUrl(livro) {
  if (livro.capa && livro.capa.url) return livro.capa.url;
  return "https://placehold.co/50x70?text=?";
}

function abrirSinopse(livro) {
  livroSinopse.value = livro;
}

function fecharSinopse() {
  livroSinopse.value = null;
}

const popup = ref({
  aberto: false,
  mensagem: '',
  tipo: 'sucesso'
})

function mostrarPopup(mensagem, tipo = 'sucesso') {
  popup.value = {
    aberto: true,
    mensagem,
    tipo
  }
}

function fecharPopup() {
  popup.value.aberto = false
}

</script>

<template>
  <div class="page">
    <div class="livro-header">
      <h1 class="page-title">Livros</h1>
      <button v-if="canManage" class="btn btn-icon" @click="abrirModal">+</button>
    </div>

    <div class="filtros-livros">

      <div class="search-wrapper">
        <input class="search-input" type="text" v-model="busca" @input="aplicarFiltros"
          placeholder="Buscar livros..." />

        <button v-if="busca" class="search-clear" @click="busca = ''; aplicarFiltros()">
          &times;
        </button>
      </div>

      <select v-model="autor" @change="aplicarFiltros" class="filtro-select">
        <option value="">Todos os autores</option>

        <option v-for="aut in autorStore.autores" :key="aut.id" :value="aut.nome">
          {{ aut.nome }}
        </option>
      </select>

      <select v-model="categoria" @change="aplicarFiltros" class="filtro-select">
        <option value="">Todas as categorias</option>
        <option v-for="cat in categoriaStore.categorias" :key="cat.id" :value="cat.descricao">
          {{ cat.descricao }}
        </option>
      </select>

      <select v-model="formato" @change="aplicarFiltros" class="filtro-select">
        <option value="">Todos os formatos</option>
        <option v-for="fmt in livroStore.formatos" :key="fmt.valor" :value="fmt.valor">
          {{ fmt.descricao }}
        </option>
      </select>

      <button v-if="busca || autor || categoria || formato" class="btn btn-outline" @click="limparFiltros">
        Limpar filtros
      </button>

    </div>

    <p v-if="livroStore.loading" class="text-muted">Carregando...</p>
    <div v-else-if="!livroStore.livros.length" class="empty-state">Nenhum livro cadastrado.</div>
    <ul class="list" v-else>
      <li class="list-item" v-for="livro in livroStore.livros" :key="livro.id">
        <div class="livro-info">
          <img :src="capUrl(livro)" alt="Capa" class="livro-capa" />

          <div>
            <strong class="titulo">{{ livro.titulo }}</strong>
            <span class="quantidade-livro" :class="{ esgotado: livro.quantidade === 0 }">
              {{ livro.quantidade > 0
                ? `${livro.quantidade} disponíveis`
                : 'Indisponível'
              }}
            </span>

            <div class="livro-botoes-mobile">
              <button class="btn btn-reservar btn-sm" @click.stop="reservarLivro(livro.id)" title="Reservar livro">
                Reservar
              </button>

              <button v-if="livro.sinopse" class="btn-sinopse" @click.stop="abrirSinopse(livro)">
                Ver sinopse
              </button>
            </div>
          </div>
        </div>
        <div class="list-item-actions">
          <button class="btn btn-reservar btn-sm" @click="reservarLivro(livro.id)"
            title="Reservar livro">Reservar</button>
          <button v-if="canManage" class="btn btn-destructive btn-sm btn-icon-sm" @click="excluir(livro.id)"
            title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg></button>
        </div>
      </li>
    </ul>

    <div class="paginator">
      <button class="btn btn-outline btn-sm" :disabled="livroStore.meta.page == 1"
        @click="livroStore.paginaAnterior">Anterior</button>
      <button class="btn btn-outline btn-sm" :disabled="livroStore.meta.page == livroStore.meta.total_pages"
        @click="livroStore.proximaPagina">Próxima</button>
      <span>Página {{ livroStore.meta.page }} de {{ livroStore.meta.total_pages }}</span>
    </div>
  </div>

  <div v-if="livroSinopse" class="sinopse-overlay" @click.self="fecharSinopse">
    <div class="sinopse-modal">

      <button class="sinopse-fechar" @click="fecharSinopse">
        &times;
      </button>

      <h2>{{ livroSinopse.titulo }}</h2>

      <img :src="capUrl(livroSinopse)" :alt="`Capa de ${livroSinopse.titulo}`" class="sinopse-capa" />

      <div class="sinopse-conteudo">
        <h3>Sinopse</h3>

        <p>
          {{ livroSinopse.sinopse }}
        </p>
      </div>

    </div>
  </div>

  <modal-adicionar-livro v-if="showModal" :livro-para-editar="livroParaEditar" @close="showModal = false"
    @salvo="aoSalvar" />

  <div v-if="popup.aberto" class="popup-overlay" @click.self="fecharPopup">
    <div class="popup">
      <button class="popup-fechar" @click="fecharPopup">
        &times;
      </button>

      <div class="popup-icone" :class="popup.tipo">
        <span v-if="popup.tipo === 'sucesso'">✓</span>
        <span v-else>!</span>
      </div>

      <h2>{{ popup.tipo === 'sucesso' ? 'Reserva realizada!' : 'Não foi possível reservar' }}</h2>
      <p>{{ popup.mensagem }}</p>

      <button class="btn btn-reservar popup-btn" @click="fecharPopup">OK</button>
    </div>
  </div>
</template>

<style scoped>
.titulo-card {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.list-item {
  padding-left: 2%;
  padding-right: 2%;
}

.btn-reservar {
  background-color: #26749F;
  border-color: #26749F;
  color: white;
}

.btn-reservar:hover {
  background-color: #368BB8;
  border-color: #368BB8;
}

.livro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.livro-info {
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
}

.list-item:hover {
  background-color: #368bb818;
  border-radius: 10px;
}

.livro-capa {
  width: 150px;
  height: 230px;
  object-fit: cover;
  border-radius: calc(var(--radius) - 2px);
}

.livro-info div {
  display: flex;
  flex-direction: column;
}

.livro-sinopse {
  font-size: 14px;
}

.sinopse-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.sinopse-modal {
  position: relative;
  background: var(--background);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--radius);
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.sinopse-modal h2 {
  margin-top: 4%;
  margin-bottom: 1.5rem;
}

.sinopse-fechar {
  position: absolute;
  top: 10px;
  right: 15px;
  border-radius: 10px;
  border: none;
  background: #368BB8;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 6px;
}

.sinopse-capa {
  width: 180px;
  height: 260px;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.sinopse-conteudo {
  text-align: left;
  margin-bottom: 1.5rem;
}

.sinopse-conteudo h3 {
  margin-bottom: 0.5rem;
}

.sinopse-conteudo p {
  line-height: 1.6;
  white-space: pre-line;
}

.btn-sinopse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: #26749F;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s ease;
  width: fit-content;
}

.btn-sinopse:hover {
  background: #368BB8;
  color: #fff;
  border-color: none;
}

.btn-sinopse:active {
  transform: translateY(1px);
}

.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.popup {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--background);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: popupEntrada 0.2s ease-out;
}

.popup-fechar {
  position: absolute;
  top: 10px;
  right: 15px;
  border: none;
  background: transparent;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-muted);
}

.popup-icone {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: bold;
}

.popup-icone.sucesso {
  background: #26749F;
  color: white;
}

.popup-icone.erro {
  background: #dc3545;
  color: white;
}

.popup h2 {
  margin: 0 0 0.75rem;
}

.popup p {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.popup-btn {
  min-width: 100px;
}

.quantidade-livro {
  margin-top: 4px;
  font-size: 13px;
}

.quantidade-livro.esgotado {
  color: #dc3545;
}

@keyframes popupEntrada {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.filtros-livros {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filtro-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--text);
  cursor: pointer;
  min-width: 180px;
}

.filtro-select:focus {
  outline: none;
  border-color: #26749F;
}

@media (max-width: 768px) {
  .filtros-livros {
    flex-direction: column;
    align-items: stretch;
  }

  .filtro-select {
    width: 100%;
  }
}

.page {
  min-height: 100vh;
  height: auto;
  overflow-y: visible;
  padding-bottom: 40px;
}

.filtro-select {
  border: 1px solid var(--secondary);
}

.list-item {
  border-color: var(--secondary);
}

.btn.btn-outline.btn-sm {
  border-color: var(--secondary);
}

.search-input {
  border-color: black;
}

/* No computador, mantém os botões nas posições atuais */
.livro-botoes-mobile {
  display: none;
}


@media (max-width: 640px) {
  .list-item {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }

  .livro-info {
    display: flex;
    flex: 1;
    min-width: 0;
    gap: 8px;
    align-items: center;
  }

  .livro-capa {
    width: 84px;
    height: 130px;
    flex-shrink: 0;
  }

  .livro-info > div {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    align-items: flex-start;
  }

  .titulo {
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .quantidade-livro {
    font-size: 12px;
    margin-top: 4px;
  }

  .livro-botoes-mobile {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 6px;
    width: 100%;
    margin-top: 8px;
  }

  .livro-botoes-mobile > button {
    flex: 1 1 0;
    min-width: 0;
    width: auto;
    box-sizing: border-box;
    margin: 0;
    padding: 7px 3px;
    font-size: 11px;
    white-space: nowrap;
  }

  .list-item-actions {
    display: none;
  }

  .btn-sinopse {
    margin-top: 0;
  }

  .filtros-livros {
    flex-direction: column;
    align-items: stretch;
  }

  .filtro-select {
    width: 100%;
  }
}
</style>