
<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.loggedIn);
const user = computed(() => authStore.user);
const isSuperuser = computed(
  () => authStore.user?.is_superuser === true
);

const showDropdown = ref(false);
const showMobileMenu = ref(false);
const currentTheme = ref(localStorage.getItem("theme") || "light");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  currentTheme.value =
    currentTheme.value === "light" ? "dark" : "light";

  localStorage.setItem("theme", currentTheme.value);
  applyTheme(currentTheme.value);
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function toggleMobileMenu(event) {
  event.stopPropagation();
  showMobileMenu.value = !showMobileMenu.value;
}

function closeMenus(e) {
  if (!e.target.closest(".user-menu")) {
    showDropdown.value = false;
  }

  if (!e.target.closest(".mobile-menu-container")) {
    showMobileMenu.value = false;
  }
}

function closeMobileMenu() {
  showMobileMenu.value = false;
}

onMounted(() => {
  document.addEventListener("click", closeMenus);
  applyTheme(currentTheme.value);
});

onUnmounted(() => {
  document.removeEventListener("click", closeMenus);
});
</script>

<template>
  <header class="navbar">
    <nav>
      <!-- ESQUERDA: botão do menu no celular -->
      <div class="nav-mobile-left">
        <div class="mobile-menu-container">
          <button
            type="button"
            class="hamburger-button"
            @click="toggleMobileMenu"
            :aria-expanded="showMobileMenu"
            aria-label="Abrir menu de navegação"
          >
            <svg
              v-if="!showMobileMenu"
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>

            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div v-if="showMobileMenu" class="mobile-dropdown">
            <router-link
              v-if="isLoggedIn && !isSuperuser"
              :to="{ name: 'reservas' }"
              class="mobile-dropdown-item"
              @click="closeMobileMenu"
            >
              <span>Minhas Reservas</span>
              <span aria-hidden="true">›</span>
            </router-link>

            <button
              type="button"
              class="mobile-dropdown-item"
              @click="toggleTheme"
            >
              <span>
                {{ currentTheme === "light" ? "Modo escuro" : "Modo claro" }}
              </span>

              <span aria-hidden="true">
                {{ currentTheme === "light" ? "☾" : "☀" }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- CENTRO: logo e título -->
      <div class="nav-brand">
        <img
          src="../assets/logo.png"
          class="logo-nav"
          alt="Logo Antares"
        />

        <router-link
          v-if="isSuperuser"
          :to="{ name: 'admin' }"
          class="nav-title"
        >
          Biblioteca Antares
        </router-link>

        <router-link
          v-else
          :to="{ name: 'livros' }"
          class="nav-title"
        >
          Biblioteca Antares
        </router-link>
      </div>

      <!-- DIREITA: ações do desktop e perfil -->
      <div class="nav-right">
        <div class="desktop-actions">
          <button
            class="nav-link theme-toggle"
            @click="toggleTheme"
            :title="currentTheme === 'light' ? 'Modo escuro' : 'Modo claro'"
            :aria-label="currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'"
          >
            <span aria-hidden="true">
              {{ currentTheme === "light" ? "☾" : "☀" }}
            </span>
          </button>

          <router-link
            v-if="isLoggedIn && !isSuperuser"
            :to="{ name: 'reservas' }"
            class="nav-link"
          >
            Minhas Reservas
          </router-link>

          <router-link
            v-if="!isLoggedIn"
            :to="{ name: 'login' }"
            class="nav-link"
          >
            Login
          </router-link>
        </div>

        <div v-if="isLoggedIn" class="user-menu">
          <button
            type="button"
            class="user-menu-button"
            @click.stop="toggleDropdown"
            aria-label="Abrir menu do usuário"
            :aria-expanded="showDropdown"
          >
            <img
              :src="user?.foto?.url || user?.foto || 'https://placehold.co/36'"
              alt="Foto do usuário"
              class="user-photo"
            />
          </button>

          <div v-if="showDropdown" class="dropdown">
            <p class="dropdown-name">{{ user?.name }}</p>
            <p class="dropdown-email">{{ user?.email }}</p>

            <router-link
              :to="{ name: 'usuario' }"
              class="dropdown-item"
              @click="closeMobileMenu"
            >
              Perfil
            </router-link>

            <router-link
              :to="{ name: 'logout' }"
              class="dropdown-item"
              @click="closeMobileMenu"
            >
              Sair
            </router-link>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.navbar nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 16px;
}

.nav-mobile-left {
  display: none;
}

.nav-brand {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  min-width: 0;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-brand .logo-nav {
  display: block;
  width: 28px;
  max-width: 28px;
  height: auto;
  flex-shrink: 0;
}

.nav-brand .nav-title {
  display: block;
  margin: 0;
  line-height: 1;
  white-space: nowrap;
  margin-left: 3px;
}

.user-menu {
  position: relative;
  cursor: pointer;
  margin-left: 4px;
}

.user-menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
}

.user-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: border-color 0.15s;
}

.user-photo:hover {
  border-color: rgba(255, 255, 255, 0.7);
}

.dropdown {
  position: absolute;
  top: 44px;
  right: 0;
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  min-width: 200px;
  z-index: 110;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-name {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.dropdown-email {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin-bottom: 8px;
  word-break: break-all;
}

.dropdown-item {
  display: block;
  text-decoration: none;
  color: var(--card-foreground);
  padding: 6px 8px;
  border-radius: calc(var(--radius) - 2px);
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background: var(--accent);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px 8px;
  line-height: 1;
}

.logo-nav {
  width: 3%;
}

.nav-title {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: large;
  margin-left: 10px;
  margin-right: 10px;
}

.nav-link {
  padding-right: 10px;
  padding-left: 10px;
}

.nav-link:hover {
  margin-top: 0;
  padding-bottom: 5px;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-menu-container {
  display: none;
  position: relative;
}

.hamburger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px;
  border: none;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  color: white;
}

.hamburger-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.mobile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: auto;
  width: 220px;
  min-width: 220px;
  max-width: calc(100vw - 24px);
  box-sizing: border-box;
  padding: 8px;
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  z-index: 120;
}

.nav-mobile-left,
.mobile-menu-container {
  overflow: visible;
}

.mobile-dropdown-item {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border: none;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: var(--card-foreground);
  text-decoration: none;
  text-align: left;
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
}

.mobile-dropdown-item:hover {
  background: var(--accent);
}

@media (max-width: 768px) {
  .desktop-actions {
    display: none;
  }

  .mobile-menu-container {
    display: block;
  }

  .logo-nav {
    width: 32px;
    max-width: 32px;
    height: auto;
    flex-shrink: 0;
  }

  .nav-title {
    font-size: 1rem;
    margin-left: 8px;
    margin-right: 4px;
    white-space: nowrap;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .navbar nav {
    position: relative;
    justify-content: space-between;
  }
  
  .nav-mobile-left {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .nav-brand {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 120px);
  }
  
  .nav-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    margin-left: auto;
  }
}

@media (max-width: 380px) {
  .nav-title {
    font-size: 0.9rem;
    margin-left: 5px;
  }

  .nav-right {
    gap: 5px;
  }

  .user-photo {
    width: 32px;
    height: 32px;
  }
}
</style>