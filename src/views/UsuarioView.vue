<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import UploadApi from "@/api/upload";
import { useRouter } from 'vue-router'

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();
const uploadApi = new UploadApi();

const usuario = computed(() => authStore.user);

const name = ref("");
const email = ref("");
const imageFile = ref(null);
const imagePreview = ref(null);
const fileInputRef = ref(null);
const loading = ref(false);

function voltarInicio() {
  if (authStore.isAdmin) {
    router.push({ name: 'admin' });
  } else {
    router.push({ name: 'livros' });
  }
}

function syncForm() {
  if (usuario.value) {
    name.value = usuario.value.name || "";
    email.value = usuario.value.email || "";
    imagePreview.value = usuario.value.foto?.url || null;
    imageFile.value = null;
  }
}

onMounted(() => {
  syncForm();
});

watch(
  usuario,
  () => {
    syncForm();
  },
  { deep: true }
);

function openSelectImage() {
  fileInputRef.value?.click();
}

function selectImage(evt) {
  const file = evt.target.files[0];
  if (file) {
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function handleSave() {
  loading.value = true;
  try {
    const payload = {
      name: name.value,
      email: email.value,
    };

    if (imageFile.value) {
      const uploaded = await uploadApi.uploadImagem(imageFile.value);
      payload.foto_attachment_key = uploaded.attachment_key;
    }

    await authStore.updateProfile(payload);
    toastStore.showToast("Perfil atualizado com sucesso!");
  } catch (err) {
    const msg =
      err.response?.data?.email?.[0] ||
      err.response?.data?.name?.[0] ||
      err.response?.data?.detail ||
      "Erro ao atualizar perfil.";
    toastStore.showToast(msg, "error");
  } finally {
    loading.value = false;
  }
}

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
</script>

<template>
  <div class="page" v-if="usuario && usuario.id">
  <div class="page-header">
    <button class="btn-voltar" @click="voltarInicio" title="Voltar"><</button>
    <h1 class="page-title">Perfil do Usuário</h1>
  </div>

    <div class="card user-card">
      <form @submit.prevent="handleSave">
        <div class="photo-section">
          <div class="photo-wrapper" @click="openSelectImage" title="Clique para alterar a foto">
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Foto do usuário"
              class="user-photo"
            />
            <img
              v-else
              src="https://placehold.co/150"
              alt="Sem foto"
              class="user-photo"
            />
            <div class="photo-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            hidden
            @input="selectImage"
            accept="image/jpeg,image/png,image/webp"
          />
          <button type="button" class="btn btn-outline btn-sm" @click="openSelectImage">
            Alterar Foto
          </button>
        </div>
        <div class="form-group">
          <label class="label" for="user-name">Nome</label>
          <input
            id="user-name"
            class="input"
            type="text"
            v-model="name"
            placeholder="Seu nome"
            required
          />
        </div>

        <div class="form-group">
          <label class="label" for="user-email">Email</label>
          <input
            id="user-email"
            class="input"
            type="email"
            v-model="email"
            placeholder="seu.email@exemplo.com"
            required
          />
        </div>

        <button type="submit" class="btn" style="width: 100%" :disabled="loading">
          {{ loading ? "Salvando..." : "Salvar Alterações" }}
        </button>
      </form>

      <hr class="divider" />
      <div class="system-info">
        <h3 class="system-title">Informações da Conta</h3>
        <p>Último Login: <strong>{{ formatDate(usuario.last_login) || "Nunca logado" }}</strong></p>
      </div>
    </div>
  </div>
  <div class="page" v-else>
    <p class="text-muted">Carregando informações do usuário...</p>
  </div>
</template>

<style scoped>
.page-header {
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
  margin-bottom: 24px;
}

.btn-voltar:hover {
  transform: translateX(-3px);
  opacity: 0.85;
}
.form-group {
  margin-bottom: 4%;
}
.user-card {
  max-width: 500px;
  margin: 0 auto;
  background-color: var(--primary);
}
.photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.photo-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid var(--border);
  transition: border-color 0.2s ease;
}
.photo-wrapper:hover {
  border-color: var(--primary, #3b82f6);
}
.photo-wrapper:hover .photo-overlay {
  opacity: 1;
}
.user-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.divider {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid var(--border);
}
.system-info {
  font-size: 0.9rem;
}
.system-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.system-info p {
  margin-bottom: 0.5rem;
  color: var(--muted-foreground);
}
.btn.btn-outline.btn-sm{
  color: black;
}
.btn.btn-outline.btn-sm:hover{
  color: white;
}
.label{
  color: white;
}
.input{
  color: white;
}
.btn{
  background-color: white;
  color: black;
  border-width: 0.5px;
  border-style: groove;
  border-color: white;
}
.btn:hover{
  background-color: black;
  color: white;
  border-width: 0.5px;
  border-style: groove;
  border-color: white;
}
</style>
