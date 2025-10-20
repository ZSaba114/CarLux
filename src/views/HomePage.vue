<template>
  <ion-page>
    <!-- MENU LATERAL -->
    <ion-menu side="start" content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar style="--background: #c3a7daff;">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-item button @click="goTo('about')">About</ion-item>
          <ion-item button @click="goTo('contact')">Contact</ion-item>
          <ion-item button @click="goTo('signup')">Sign In</ion-item>
          <ion-item button @click="goTo('login')">Login</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- HEADER -->
    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>

        <ion-title>CARLux</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="openGarage">Voir Garage</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- CONTENU PRINCIPAL -->
    <ion-content id="main-content" fullscreen>
      <div class="bg" :style="{ backgroundImage: `url(${bgImage})` }">
        <div class="welcome-container">
          <h1 class="welcome-title">Welcome To Our App</h1>
          <ion-button
            expand="block"
            @click="startDiscover"
            style="--background: #f575b5ff; --color: black;"
          >
            Start Discover
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonMenuButton,
  IonMenu,
  IonList,
  IonItem,
  IonButtons
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import bgImage from '@/assets/car1.jpg'

const router = useRouter()

// ✅ Correction : ouvrir la page complète MainUser comme Login ou Signup
function startDiscover() {
  window.location.href = '/mainuser' // navigation complète (nouvelle page)
}

// Navigation via router pour les autres pages
function goTo(routeName) {
  router.push(`/${routeName}`)
}

// Ouvrir le garage dans un nouvel onglet
function openGarage() {
  window.open('/CarLuxGarage/index.html', '_blank')
}
</script>

<style scoped>
.bg {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100%;
  width: 100%;
}

.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: white;
}

.welcome-title {
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 80px;
  text-align: center;
}

ion-button {
  margin-top: 40px;
}
</style>
