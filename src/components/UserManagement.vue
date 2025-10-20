<template>
    <div>
        <div v-if="statusMessage" :class="['status-message', statusType]">
            {{ statusMessage }}
        </div>

        <h3 class="section-title">👤 User Management  ({{ users.length }})</h3>

        <div class="user-list">
            <div v-if="users.length === 0 && !isFetching" class="no-users">
                Aucun utilisateur régulier trouvé dans la base de données.
            </div>
            <div v-else-if="isFetching" class="loading-state">
                Chargement des utilisateurs...
            </div>

            <ion-card v-else v-for="user in users" :key="user.id" class="user-card">
                <div class="user-info">
                    <ion-card-title>{{ user.email || 'Email non spécifié' }}</ion-card-title>
                    <p><strong>Rôle:</strong> <span :class="{'role-user': user.role !== 'admin'}">{{ user.role || 'Utilisateur' }}</span></p>
                    <p class="user-id"><strong>ID:</strong> {{ user.id }}</p>
                </div>
                
                <ion-button 
                    @click="confirmDeleteUser(user.id)" 
                    class="delete-button"
                    expand="block"
                >
                    <ion-icon :icon="trashOutline"></ion-icon> Supprimer
                </ion-button>
            </ion-card>
        </div>

        <ion-modal :is-open="isConfirmModalOpen" @didDismiss="handleDeleteConfirmation(false)">
            <ion-header>
                <ion-toolbar style="--background: #2b0f3fff; --color: white;">
                    <ion-title>Confirmer la suppression</ion-title>
                </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
                <p>Cette action est irréversible dans Firestore. Le compte d'authentification (login) devra être supprimé manuellement.</p>
                <div class="ion-text-right" style="margin-top: 20px;">
                    <ion-button color="medium" @click="handleDeleteConfirmation(false)" style="margin-right: 10px;">Annuler</ion-button>
                    <ion-button color="danger" @click="handleDeleteConfirmation(true)">Confirmer la Suppression</ion-button>
                </div>
            </ion-content>
        </ion-modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
    IonCard, IonCardTitle, IonButton, IonIcon, IonModal, IonHeader, 
    IonToolbar, IonTitle, IonContent 
} from '@ionic/vue'
import { trashOutline } from 'ionicons/icons'

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; 

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
const auth = getAuth(app); 
const db = getFirestore(app);

const users = ref([])
const currentUserId = ref(null)
const statusMessage = ref('')
const statusType = ref('')
const isFetching = ref(true)

const isConfirmModalOpen = ref(false)
const userToDeleteId = ref(null)

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId.value = user.uid;
            fetchUsers();
        } else {
            isFetching.value = false;
            console.error("Erreur: Utilisateur non authentifié dans UserManagement component.");
        }
    });
});

const fetchUsers = () => {
    isFetching.value = true;
    const usersColRef = collection(db, 'users');
    
    onSnapshot(usersColRef, (snapshot) => {
        const fetchedUsers = [];
        snapshot.docs.forEach(doc => {
            const userData = { id: doc.id, ...doc.data() };
            
            if (userData.id !== currentUserId.value && userData.role !== 'admin') {
                fetchedUsers.push(userData);
            }
        });
        users.value = fetchedUsers;
        isFetching.value = false;
    }, (error) => {
        console.error("Erreur de lecture des utilisateurs:", error);
        statusMessage.value = 'Erreur lors du chargement des utilisateurs.';
        statusType.value = 'error';
        isFetching.value = false;
    });
}

const confirmDeleteUser = (userId) => {
    userToDeleteId.value = userId;
    isConfirmModalOpen.value = true;
}

const handleDeleteConfirmation = (confirmed) => {
    isConfirmModalOpen.value = false;
    if (confirmed && userToDeleteId.value) {
        deleteUser(userToDeleteId.value);
    }
    userToDeleteId.value = null;
}

const deleteUser = async (userDocId) => {
    statusMessage.value = '';
    statusType.value = '';
    
    try {
        await deleteDoc(doc(db, 'users', userDocId));
        
        statusMessage.value = `✅ Le document utilisateur (ID: ${userDocId}) a été supprimé de Firestore.`;
        statusType.value = 'success';
        
        setTimeout(() => { statusMessage.value = ''; }, 6000);
        
    } catch (error) {
        statusMessage.value = `❌ Erreur lors de la suppression du document utilisateur. Veuillez vérifier les règles Firestore.`;
        statusType.value = 'error';
        console.error("Erreur Firestore lors de la suppression:", error);
    }
}
</script>

<style scoped>
.section-title {
  color: #fff; /* titre User Management en blanc */
  border-bottom: 2px solid #2b0f3fff;
  padding-bottom: 5px;
  margin-bottom: 20px;
}

.user-list {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.user-card {
  --background: rgba(7, 5, 8, 0.8);
  color: white;
  border: 1px solid #9655c5ff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.user-card ion-card-title {
    color: #fff; /* email en blanc */
}

.user-info p {
    margin: 5px 0;
    font-size: 0.9em;
}

.user-id {
    color: #ccc;
    font-size: 0.8em !important;
    word-break: break-all;
}

.role-user {
    color: #a87affff; 
}

/* BOUTON SUPPRIMER EN ROSE */
.delete-button {
    --background: #ff69b4; /* rose vif */
    --color: white;
    margin-top: 15px;
    font-weight: bold;
}

.no-users, .loading-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 30px;
    background: rgba(0,0,0,0.6);
    border-radius: 8px;
    color: #fff;
}

.status-message {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  font-weight: bold;
  text-align: center;
}

.status-message.success {
  background-color: #28a745; 
  color: white;
}

.status-message.error {
  background-color: #86242eff;
  color: white;
}
</style>
