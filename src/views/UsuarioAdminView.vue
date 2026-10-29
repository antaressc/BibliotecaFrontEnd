<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useUsuarioStore } from "@/stores/usuario";
import { useToastStore } from "@/stores/toast";
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const usuarioStore = useUsuarioStore();
const toast = useToastStore();
const router = useRouter();
const authStore = useAuthStore();

const defaultUsuario = {
    id: null,
    name: '',
    email: '',
    password: '',
    is_active: true,
    is_staff: false,
    is_superuser: false
}

const usuario = reactive({ ...defaultUsuario });
const busca = ref("");
const editando = ref(false);

let buscaTimer = null;

onMounted(async () => {
    await usuarioStore.getUsuarios();
});

onUnmounted(() => {
    clearTimeout(buscaTimer);
});

function limparFormulario() {
    Object.assign(usuario, defaultUsuario)
    editando.value = false
}

function editarUsuario(item) {
    Object.assign(usuario, {
        id: item.id,
        name: item.name || "",
        email: item.email || "",
        is_active: item.is_active,
        is_staff: item.is_staff,
        is_superuser: item.is_superuser,
    });

    editando.value = true;

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}

async function salvarUsuario() {
    try {
        if (!usuario.name || !usuario.email) {
            toast.error('Preencha nome e e-mail.')
            return
        }

        if (!editando.value && !usuario.password) {
            toast.error('Informe uma senha.')
            return
        }

        if (!editando.value && usuario.password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres.')
            return
        }

        const dados = {
            ...usuario
        }

        if (editando.value && !dados.password) {
            delete dados.password
        }

        await usuarioStore.salvarUsuario(dados)

        toast.success(
            editando.value
                ? 'Usuário atualizado com sucesso!'
                : 'Usuário cadastrado com sucesso!'
        )

        limparFormulario()

    } catch (error) {
        console.error(error)

        const mensagem =
            error.response?.data?.password?.[0] ||
            error.response?.data?.email?.[0] ||
            'Erro ao salvar usuário.'

        toast.error(mensagem)
    }
}

function onBusca() {
    clearTimeout(buscaTimer);

    buscaTimer = setTimeout(() => {
        usuarioStore.getUsuarios(1, busca.value);
    }, 400);
}

function formatarData(data) {
    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString("pt-BR");
}

function voltarInicio() {
    if (authStore.isAdmin) {
        router.push({ name: 'admin' });
    } else {
        router.push({ name: 'livros' });
    }
}

</script>

<template>
    <div class="usuario-admin-page">

        <div class="page-header">
            <div class="page-title-container">
                <button class="btn-voltar" @click="voltarInicio" title="Voltar">
                    &lt;
                </button>

                <h1 class="page-title">Usuários</h1>
            </div>

            <p class="page-subtitle">
                Gerencie os usuários cadastrados no sistema.
            </p>
        </div>

        <section class="form-card">
            <div class="card-header">
                <h2>
                    {{ editando ? "Editar usuário" : "Novo usuário" }}
                </h2>

                <button v-if="editando" type="button" class="btn btn-secondary" @click="limparFormulario">
                    Cancelar
                </button>
            </div>

            <form @submit.prevent="salvarUsuario">

                <div class="form-grid">

                    <div class="form-group">
                        <label for="nome">
                            Nome
                        </label>

                        <input id="nome" v-model="usuario.name" class="input-text" type="text"
                            placeholder="Nome do usuário" autocomplete="name" />
                    </div>

                    <div class="form-group">
                        <label for="email">
                            E-mail
                        </label>

                        <input id="email" v-model="usuario.email" class="input-text" type="email"
                            placeholder="E-mail do usuário" autocomplete="email" />
                    </div>

                    <div v-if="!editando" class="form-group">
                        <label for="senha">
                            Senha
                        </label>

                        <input id="senha" v-model="usuario.password" class="input-text" type="password"
                            placeholder="Senha do usuário" autocomplete="new-password" minlength="8" />
                    </div>

                </div>

                <div class="permissions-section">
                    <h3>Permissões</h3>

                    <div class="permissions-grid">

                        <label class="checkbox-option">
                            <input v-model="usuario.is_active" type="checkbox" />

                            <div>
                                <strong>Usuário ativo</strong>
                                <span>
                                    Permite que o usuário acesse o sistema.
                                </span>
                            </div>
                        </label>

                        <label class="checkbox-option">
                            <input v-model="usuario.is_staff" type="checkbox" />

                            <div>
                                <strong>Staff</strong>
                                <span>
                                    Permite acesso às funções administrativas.
                                </span>
                            </div>
                        </label>

                        <label class="checkbox-option">
                            <input v-model="usuario.is_superuser" type="checkbox" />

                            <div>
                                <strong>Superusuário</strong>
                                <span>
                                    Concede todas as permissões do sistema.
                                </span>
                            </div>
                        </label>

                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" @click="limparFormulario">
                        Limpar
                    </button>

                    <button type="submit" class="btn btn-primary">
                        {{ editando ? "Salvar alterações" : "Cadastrar usuário" }}
                    </button>
                </div>

            </form>
        </section>

        <section class="list-card">

            <div class="list-header">

                <div>
                    <h2>Usuários cadastrados</h2>

                    <span class="list-count">
                        {{ usuarioStore.usuarios.length }} usuários
                    </span>
                </div>

                <div class="search-container">
                    <input v-model="busca" type="text" placeholder="Buscar por nome ou e-mail..." @input="onBusca" />
                </div>

            </div>

            <div v-if="usuarioStore.usuarios.length" class="table-container">

                <table>

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Status</th>
                            <th>Permissão</th>
                            <th>Último login</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr v-for="item in usuarioStore.usuarios" :key="item.id">

                            <td>
                                #{{ item.id }}
                            </td>

                            <td>
                                <div class="user-name">
                                    {{ item.name || "Sem nome" }}
                                </div>
                            </td>

                            <td>
                                {{ item.email }}
                            </td>

                            <td>
                                <span class="status-badge" :class="item.is_active
                                    ? 'status-active'
                                    : 'status-inactive'
                                    ">
                                    {{
                                        item.is_active
                                            ? "Ativo"
                                            : "Inativo"
                                    }}
                                </span>
                            </td>

                            <td>

                                <span v-if="item.is_superuser" class="role-badge role-superuser">
                                    Superusuário
                                </span>

                                <span v-else-if="item.is_staff" class="role-badge role-staff">
                                    Staff
                                </span>

                                <span v-else class="role-badge role-user">
                                    Usuário
                                </span>

                            </td>

                            <td>
                                {{ formatarData(item.last_login) }}
                            </td>

                            <td>

                                <div class="actions">

                                    <button type="button" class="btn-action btn-edit" title="Editar usuário"
                                        @click="editarUsuario(item)">
                                        Editar
                                    </button>

                                </div>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

            <div v-else class="empty-state">
                <h3>Nenhum usuário encontrado</h3>

                <p>
                    {{
                        busca
                            ? "Não encontramos usuários para essa busca."
                            : "Ainda não existem usuários cadastrados."
                    }}
                </p>
            </div>

        </section>

    </div>
</template>

<style scoped>
.page-title-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.btn-voltar {
    width: 30px;
    height: 30px;
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
    flex-shrink: 0;
    margin-bottom: 0;
}

.btn-voltar:hover {
    transform: translateX(-3px);
    opacity: 0.85;
}

.page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.usuario-admin-page {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 30px;
}

.page-header {
    margin-bottom: 25px;
}

.page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.page-subtitle {
    margin: 6px 0 0;
    opacity: 0.7;
}

.form-card,
.list-card {
    background: var(--background);
    border: 1px solid var(--secondary);
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 25px;
}

.card-header,
.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
}

.card-header h2,
.list-header h2 {
    margin: 0;
    font-size: 20px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
    color: var(--text-color, #000);
}

.form-group label {
    font-weight: 600;
    color: var(--secondary);
}

.form-group input,
.search-container input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 13px;
    border: 1px solid var(--secondary);
    border-radius: 8px;
    background: var(--input-bg, #fff);
    color: inherit;
    outline: none;
}

.form-group input:focus,
.search-container input:focus {
    border-color: var(--primary-color, #2563eb);
}

.permissions-section {
    margin-top: 25px;
}

.permissions-section h3 {
    margin: 0 0 15px;
    font-size: 16px;
}

.permissions-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 15px;
    border: 1px solid var(--secondary);
    border-radius: 8px;
    cursor: pointer;
}

.checkbox-option input {
    margin-top: 3px;
}

.checkbox-option div {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.checkbox-option span {
    font-size: 13px;
    opacity: 0.65;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
}

.btn {
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--primary-color, #2563eb);
    color: white;
}

.btn-secondary {
    background: var(--secondary-bg, #e5e7eb);
    color: rgb(53, 53, 53);
}

.list-count {
    display: block;
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.6;
}

.search-container {
    width: 320px;
    color: #000;
    border-radius: 10px;
}

.table-container {
    width: 100%;
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 14px 12px;
    text-align: left;
    border-bottom: 1px solid var(--secondary);
    white-space: nowrap;
}

th {
    font-size: 13px;
    font-weight: 700;
    opacity: 0.7;
}

.user-name {
    font-weight: 600;
}

.status-badge,
.role-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.status-active {
    background: #dcfce7;
    color: #166534;
}

.status-inactive {
    background: #fee2e2;
    color: #991b1b;
}

.role-superuser {
    background: #fef3c7;
    color: #92400e;
}

.role-staff {
    background: #dbeafe;
    color: #1e40af;
}

.role-user {
    background: #e5e7eb;
    color: #374151;
}


.actions {
    display: flex;
    gap: 8px;
}

.btn-action {
    border: none;
    border-radius: 6px;
    padding: 7px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.btn-edit {
    background: #dbeafe;
    color: #1e40af;
}

.btn-delete {
    background: #fee2e2;
    color: #991b1b;
}

.empty-state {
    padding: 50px 20px;
    text-align: center;
    opacity: 0.7;
}

.empty-state h3 {
    margin: 0 0 8px;
}

.empty-state p {
    margin: 0;
}

@media (max-width: 900px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .permissions-grid {
        grid-template-columns: 1fr;
    }

    .list-header {
        align-items: stretch;
        flex-direction: column;
    }

    .search-container {
        width: 100%;
    }
}

@media (max-width: 600px) {
    .usuario-admin-page {
        padding: 15px;
    }

    .form-card,
    .list-card {
        padding: 18px;
    }

    .form-actions {
        flex-direction: column;
    }

    .form-actions .btn {
        width: 100%;
    }

}
</style>