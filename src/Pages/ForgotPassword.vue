<template>
  <ion-page>
    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Forgot Password</ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- ✅ Ajout du binding dynamique sur l'image de fond -->
    <ion-content class="ion-padding forgot-bg" :style="{ backgroundImage: `url(${bgImage})` }">
      <div class="forgot-container">
        <h2>Reset your password</h2>

        <ion-input
          label="Email"
          label-placement="floating"
          type="email"
          placeholder="Enter your email"
          fill="outline"
          v-model="email"
        ></ion-input>

        <ion-button expand="block" @click="resetPassword" style="--background: #8143b4ff;">
          Send Reset Link
        </ion-button>

        <p v-if="message" class="message">{{ message }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import bgImage from "@/assets/car1.jpg"; // ✅ import correcte
import { ref } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonBackButton,
  IonButtons,
} from "@ionic/vue";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";

const email = ref("");
const message = ref("");
const error = ref("");

async function resetPassword() {
  message.value = "";
  error.value = "";

  if (!email.value || !email.value.includes("@")) {
    error.value = "Please enter a valid email.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.value);
    message.value = "A password reset link has been sent to your email.";
  } catch (err) {
    console.error(err);
    switch (err.code) {
      case "auth/user-not-found":
        error.value = "No account found with this email.";
        break;
      default:
        error.value = "Failed to send reset email.";
    }
  }
}
</script>

<style scoped>
/* ✅ IMAGE DE FOND SUR TOUTE LA PAGE */
.forgot-bg {
  --background: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  min-height: 100vh;
}

/* ✅ Conteneur semi-transparent au centre */
.forgot-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 60px auto;
  background-color: rgba(82, 39, 112, 0.75);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  color: white;
  text-align: center;
}

ion-input {
  --background: rgba(255, 255, 255, 0.15);
  --color: white;
  --placeholder-color: rgba(255, 255, 255, 0.7);
  --highlight-color-focused: white;
  --border-color: white;
  border-radius: 8px;
}

ion-input:hover {
  --background: rgba(255, 255, 255, 0.25);
}

.error {
  color: #ff6b6b;
  font-size: 14px;
}

.message {
  color: #7CFC00;
  font-size: 14px;
}
</style>
