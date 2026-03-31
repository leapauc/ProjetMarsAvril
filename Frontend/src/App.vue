<template>
  <div id="app-root">
    <NavBar />
    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <CookieBanner />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import CookieBanner from './components/CookieBanner.vue'
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to   { opacity: 0; transform: translateY(-10px); }

#app-root { display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; }
</style>
