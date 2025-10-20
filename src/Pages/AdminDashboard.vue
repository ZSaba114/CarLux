<template>
  <ion-page>
    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :style="{'--background': 'none', backgroundImage: `url(${bgImage})`}" class="dashboard-bg">
      <div class="dashboard-wrapper">
        <div class="sidebar">

          <h3 class="menu-title">Menu</h3>
          <ul class="menu-list">
            <li @click="activeSection = 'users'" :class="{ active: activeSection === 'users' }">👤 User Management</li>
            <li @click="activeSection = 'commandes'" :class="{ active: activeSection === 'commandes' }">📦 Commandes</li>
            <li @click="activeSection = 'accessories'" :class="{ active: activeSection === 'accessories' }">🧰 Accessories</li>
            <li @click="activeSection = 'designs'" :class="{ active: activeSection === 'designs' }">🚀 Design</li>
            <li @click="logout" class="logout">🚪 Déconnexion</li>
          </ul>
        </div>

        <div class="content-area">
          <div v-if="activeSection === null" class="welcome">
            <h2>Welcome, Admin!</h2>
            <p>Select a section from the menu.</p>
          </div>

          <div v-if="activeSection === 'users'">
            <UserManagement />
          </div>

          <div v-if="activeSection === 'commandes'">
            <CommandesDisplay />
          </div>

          <div v-if="activeSection === 'accessories'">
            <AdminAccessories />
          </div>

          <div v-if="activeSection === 'designs'">
            <AdminDesign />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
import UserManagement from '@/components/UserManagement.vue'
import CommandesDisplay from '@/components/CommandesDisplay.vue' 
import AdminAccessories from '@/components/AdminAccessories.vue'
import AdminDesign from '@/components/AdminDesign.vue'

import bgImage from '@/assets/car5.jpg' 

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; // Importez getFirestore si vous en avez besoin ici pour l'initialisation globale

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
const auth = getAuth(app); 
const db = getFirestore(app); 

const router = useRouter()
const activeSection = ref(null)


onMounted(() => {
    // Vérifie l'état d'authentification au chargement
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("Utilisateur déconnecté. Redirection.");
            router.push('/login');
        }
    });
});


const logout = async () => {
    try {
        await signOut(auth);
        console.log('Déconnexion Firebase réussie.');
    } catch (error) {
        console.error("Erreur lors de la déconnexion de Firebase:", error);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    router.push('/home');
}
</script>

<style scoped>
/* Les styles sont inchangés */
.dashboard-bg {
  background-size: cover;
  background-position: center;
  color: white;
  height: 100%;
}

.dashboard-wrapper {
  display: flex;
  height: 100%;
  backdrop-filter: blur(4px);
}

.sidebar {
  width: 220px;
  background: rgba(0, 0, 0, 0.6);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #2b0f3fff;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.menu-title {
  text-align: center;
  font-weight: bold;
  color: #fff;
  margin-bottom: 15px;
}

.menu-list {
  list-style: none;
  padding: 0;
}

.menu-list li {
  padding: 12px 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  font-weight: 500;
  background: rgba(252, 252, 252, 0.36);
}

.menu-list li:hover {
  background: #7735a7ff;
}

.menu-list li.active {
  background: #2b0f3fff;
  color: #fff;
}

.logout {
  background: #d12999ff !important;
  margin-top: auto;
  text-align: center;
}

.content-area {
  flex: 1;
  padding: 25px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  margin: 20px;
  overflow-y: auto;
}

.welcome {
  text-align: center;
  color: #fff;
  margin-top: 60px;
}
</style>