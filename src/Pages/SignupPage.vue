<template>
  <ion-page>
    <ion-menu side="start" content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar style="--background: #c3a7daff;">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list class="menu-list">
          <ion-item button @click="goTo('home')">Home</ion-item>
          <ion-item button @click="goTo('login')">Login</ion-item>
          <ion-item button @click="goTo('about')">About</ion-item>
          <ion-item button @click="goTo('contact')">Contact</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>CARLux</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goTo('home')">Home</ion-button>
          <ion-button @click="goTo('login')">Login</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content id="main-content" fullscreen>
      <div class="bg" :style="{ backgroundImage: `url(${bgImage})` }">
        <div class="registration-container">
          <h2>Créer un Compte</h2>

          <ion-input
            label="Email"
            label-placement="floating"
            type="email"
            placeholder="Entrez votre email"
            fill="outline"
            v-model="email"
          ></ion-input>

          <ion-input
            label="Mot de passe"
            label-placement="floating"
            type="password"
            placeholder="Entrez un mot de passe (min 6 caractères)"
            fill="outline"
            v-model="password"
          ></ion-input>
          
          <ion-input
            label="Nom complet"
            label-placement="floating"
            type="text"
            placeholder="Entrez votre nom complet"
            fill="outline"
            v-model="fullName"
          ></ion-input>

          <ion-button @click="registerUser" style="--background: #8A2BE2; --color: white;">
            S'inscrire
          </ion-button>
          
          <ion-button @click="goTo('login')" fill="clear" style="--color: #af84d3ff;">
            J'ai déjà un compte
          </ion-button>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success">{{ successMessage }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonMenuButton, IonList, IonItem, IonMenu, IonInput
} from "@ionic/vue";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
const auth = getAuth(app);
const db = getFirestore(app);

import bgImage from "@/assets/car1.jpg";

const router = useRouter();
const email = ref("");
const password = ref("");
const fullName = ref("");
const errorMessage = ref("");
const successMessage = ref("");

async function registerUser() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!email.value || !email.value.includes("@") || password.value.length < 6) {
    errorMessage.value = "Veuillez vérifier votre email et mot de passe (min 6 caractères).";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
    const user = userCredential.user;
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      fullName: fullName.value,
      role: "user", // Assignation du rôle par défaut 'user'
      createdAt: new Date()
    });
    
    successMessage.value = "Compte créé avec succès ! Redirection...";
    setTimeout(() => {
        router.push("/discover"); // Redirige vers le dashboard utilisateur
    }, 1500);

  } catch (error) {
    console.error("Registration error:", error);
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage.value = "Cette adresse e-mail est déjà utilisée.";
        break;
      case "auth/invalid-email":
        errorMessage.value = "Adresse e-mail invalide.";
        break;
      case "auth/weak-password":
        errorMessage.value = "Le mot de passe doit contenir au moins 6 caractères.";
        break;
      default:
        errorMessage.value = "Erreur d'inscription. Veuillez réessayer.";
    }
  }
}

function goTo(page) {
  router.push(`/${page}`);
}
</script>

<style scoped>
.bg {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.registration-container {
  background-color: rgba(223, 205, 223, 0.6.5);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 12px 8px 20px pink, 0 7px 15px pink;
  width: 100%;
  max-width: 400px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h2 {
  color: white;
  font-weight: bold;
  margin-bottom: 20px;
}

ion-input {
  --color: white;
  --placeholder-color: rgba(255,255,255,0.7);
  --background: rgba(255, 255, 255, 0.1);
  --border-color: rgba(255,255,255,0.5);
  --highlight-color-focused: white;
}

ion-input:hover {
  --background: rgba(255, 255, 255, 0.2);
  --border-color: white;
}

ion-button {
  font-weight: bold;
}

.error {
  color: #dc3545; /* Rouge d'erreur */
  font-size: 14px;
  margin-top: 10px;
  font-weight: bold;
}

.success {
    color: #28a745; /* Vert de succès */
    font-size: 14px;
    margin-top: 10px;
    font-weight: bold;
}

.menu-list ion-item {
  --background: rgba(255, 255, 255, 0.9);
  margin: 10px;
  border-radius: 8px;
  color: #2b0f3fff;
  font-weight: bold;
  transition: transform 0.2s;
}

.menu-list ion-item:hover {
  transform: scale(1.05);
}
</style>
