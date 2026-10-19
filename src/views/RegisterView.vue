<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToastStore();

const email = ref('');
const name = ref('');
const password = ref('');
const passwordConfirm = ref('');

async function handleRegister() {
  if (password.value !== passwordConfirm.value) {
    toast.showToast('As senhas não conferem.', 'error');
    return;
  }

  try {
    await authStore.register(email.value, name.value, password.value);

    toast.showToast(
      'Cadastro realizado! Aguarde a ativação da sua conta.',
      'success'
    );

    router.push({ name: 'login' });

  } catch (err) {
    const msg = err.response?.data?.email?.[0]
      || err.response?.data?.password?.[0]
      || err.response?.data?.detail
      || 'Erro ao criar conta. Verifique os dados.';

    toast.showToast(msg, 'error');

  }
}
</script>

<template>
  <div class="auth-page">
    <img class="page-logo text-center" src="@/assets/logoHorizontal.png" alt="Login" />
    <div class="card auth-card">
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="label" for="name">Nome</label>
          <input id="name" type="text" v-model="name" autocomplete="name" />
        </div>
        <div class="form-group">
          <label class="label" for="reg-email">Email</label>
          <input id="reg-email" type="email" v-model="email" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label class="label" for="reg-pass">Senha (mínimo 8 caracteres)</label>
          <input id="reg-pass" type="password" v-model="password" autocomplete="new-password" required />
        </div>
        <div class="form-group">
          <label class="label" for="reg-pass-confirm">Confirmar senha</label>
          <input id="reg-pass-confirm" type="password" v-model="passwordConfirm" autocomplete="new-password" required />
        </div>
        <button type="submit" class="btn" style="width:100%">Cadastrar</button>
      </form>
      <p class="text-muted text-sm" style="margin-top:16px;text-align:center">
        Já tem conta? <router-link :to="{ name: 'login' }">Faça login</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.page-logo.text-center {
  display: block;
  margin: 0 auto;
  width: 250px;
  height: auto;
  margin-bottom: 5%;
}

.auth-page {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background-image: url('@/assets/imagemBackground.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0px;
}

.label{
  color: white;
}

.card.auth-card{
  border-color: black;
}

.card.auth-card input{
  border-color: white;
  color: white;
}

.btn{
  background-color: white;
  color: black;
}

</style>