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
        <ion-list class="menu-list">
          <ion-item button @click="goTo('home')">Home</ion-item>
          <ion-item button @click="goTo('signup')">Sign Up</ion-item>
          <ion-item button @click="goTo('about')">About</ion-item>
          <ion-item button @click="goTo('contact')">Contact</ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- HEADER PRINCIPAL -->
    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>CARLux</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goTo('home')">Home</ion-button>
          <ion-button @click="openGarage">Voir Garage</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- CONTENU -->
    <ion-content id="main-content" fullscreen>
      <div class="bg" :style="{ backgroundImage: `url(${bgImage})` }">
        <div class="login-container">
          <h2>Login</h2>

          <ion-input
            label="Email"
            label-placement="floating"
            type="email"
            placeholder="Enter your email"
            fill="outline"
            v-model="email"
          ></ion-input>

          <ion-input
            label="Password"
            label-placement="floating"
            type="password"
            placeholder="Enter your password"
            fill="outline"
            v-model="password"
          ></ion-input>

          <ion-button @click="loginUser" style="--background: #551e81ff; --color: white;">
            Login
          </ion-button>

          <ion-button @click="goTo('forgot-password')" style="--background: #af84d3ff; --color: black;">
            Forgot Password ?
          </ion-button>
          
          <ion-button @click="goTo('signup')" fill="clear" style="--color: #af84d3ff;">
            Pas encore de compte ? S'inscrire
          </ion-button>


          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
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

// --- Imports Firebase et Configuration Canvas ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
const auth = getAuth(app);
const db = getFirestore(app);
// ---------------------------------------------

import bgImage from "@/assets/car1.jpg";

const router = useRouter();
const email = ref("");
const password = ref("");
const errorMessage = ref("");

async function loginUser() {
  errorMessage.value = "";

  if (!email.value || !email.value.includes("@")) {
    errorMessage.value = "Veuillez entrer une adresse e-mail valide.";
    return;
  }
  if (!password.value) {
    errorMessage.value = "Veuillez entrer le mot de passe.";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    const user = userCredential.user;

    // Récupération du rôle de l'utilisateur dans Firestore
    const userDocRef = doc(db, "users", user.uid); 
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      errorMessage.value = "Données utilisateur non trouvées. Veuillez vous inscrire.";
      // Optionnel: Déconnecter l'utilisateur si les données Firestore sont manquantes
      // await signOut(auth);
      return;
    }

    const userData = userDocSnap.data();

    // LOGIQUE DE REDIRECTION BASÉE SUR LE RÔLE
    if (userData.role === "admin") {
      router.push("/admin-dashboard");
    } else {
      // Redirection par défaut pour les utilisateurs non-admin
      router.push("/user-dashboard"); // <= CHANGEMENT ICI
    }

  } catch (error) {
    console.error("Login error:", error);
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage.value = "Adresse e-mail invalide.";
        break;
      case "auth/user-not-found":
        errorMessage.value = "Utilisateur non trouvé.";
        break;
      case "auth/wrong-password":
      case "auth/invalid-credential": // Code plus générique dans les versions récentes
        errorMessage.value = "Mot de passe ou identifiant incorrect.";
        break;
      default:
        errorMessage.value = "Erreur de connexion.";
    }
  }
}

function goTo(page) {
  // Correction pour 'signin' qui doit pointer vers 'signup' si vous utilisez le terme d'origine
  if (page === 'signin') {
      router.push('/signup'); 
  } else {
      router.push(`/${page}`);
  }
}

function openGarage() {
  window.open('/CarLuxGarage/index.html', '_blank');
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

.login-container {
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



.error {
  color: red;
  font-size: 14px;
  margin-top: 10px;
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
