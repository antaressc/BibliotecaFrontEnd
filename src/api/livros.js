import axios from "axios";

export default class LivrosApi {
async buscarTodosOsLivros(
  page = 1,
  search = "",
  autor = "",
  categoria = "",
  formato = ""
) {
  const params = new URLSearchParams();

  params.append("page", page);

  if (search) params.append("search", search);
  if (autor) params.append("autores__nome", autor);
  if (categoria) params.append("categoria__descricao", categoria);
  if (formato) params.append("formato", formato);

  const { data } = await axios.get(
    `/livros/?${params.toString()}`
  );

  return data;
}

  async buscarLivro(id) {
    const { data } = await axios.get(`/livros/${id}/`);
    return data;
  }

  async adicionarLivro(livro) {
    const { data } = await axios.post(
      "/livros/",
      livro
    );

    return data;
  }

  async atualizarLivro(livro) {
    const { data } = await axios.put(
      `/livros/${livro.id}/`,
      livro
    );

    return data;
  }

  async excluirLivro(id) {
    await axios.delete(`/livros/${id}/`);
  }

  async alterarPreco(id, preco) {
    const { data } = await axios.patch(
      `/livros/${id}/alterar_preco/`,
      { preco }
    );

    return data;
  }

  async ajustarEstoque(id, quantidade) {
    const { data } = await axios.post(
      `/livros/${id}/ajustar_estoque/`,
      { quantidade }
    );

    return data;
  }

  async adicionarAoCarrinho(
    id,
    quantidade = 1
  ) {
    const { data } = await axios.post(
      `/livros/${id}/adicionar_ao_carrinho/`,
      { quantidade }
    );

    return data;
  }

  async uploadCapa(file) {
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await axios.post(
      "/media/images/",
      formData
    );

    return data;
  }

  async buscarFormatos() {
    const { data } = await axios.get("/formatos/");
    return data;
  }
}