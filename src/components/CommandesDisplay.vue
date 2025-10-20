<template>
  <div class="commandes-display">
    <h2 class="section-title">📦 Gestion des Commandes (Accessoires & Designs)</h2>
    <p class="summary-text">Total des commandes en attente : <span class="pending-count">{{ pendingOrders.length }}</span></p>

    <div v-if="isLoading" class="loading-state">
      <p>Chargement des commandes...</p>
    </div>

    <div v-else-if="allOrders.length === 0" class="empty-state">
      <p>Aucune commande n'a encore été passée.</p>
    </div>

    <div v-else class="orders-grid">


      <ion-card 
        v-for="order in sortedOrders" 
        :key="order.id" 
        :class="['order-card', order.type, order.status.toLowerCase()]"
      >
        <ion-card-header>
          <ion-card-title :class="['order-title', order.type]">
            Commande #{{ order.id.substring(0, 8) }} 
            <span class="order-type">({{ order.type === 'design-order' ? 'DESIGN' : 'ACCESSOIRES' }})</span>
          </ion-card-title>
          <ion-card-subtitle>
            Passée le: {{ formatDate(order.createdAt) }}
          </ion-card-subtitle>
        </ion-card-header>

        <ion-card-content class="order-details">
          <p><strong>Total:</strong> <span class="total-amount">{{ order.total.toFixed(2) }} €</span></p>
          <p><strong>Utilisateur:</strong> <span class="user-id">{{ order.userId.substring(0, 10) }}...</span></p>
          <p><strong>Client:</strong> {{ order.details.fullName }} ({{ order.details.phoneNumber }})</p>
          <p><strong>Adresse:</strong> {{ order.details.address }}</p>

          <h4 class="items-title">Articles ({{ order.items.length }}) :</h4>
          <ul class="items-list">
            <li v-for="(item, index) in order.items" :key="index">
              - {{ item.name }} ({{ item.price.toFixed(2) }} €)
            </li>
            <li v-if="order.type === 'design-order'">
                <a :href="order.details.imageUrl" target="_blank" class="image-link" v-if="order.details.imageUrl">Voir Photo Voiture</a>
            </li>
          </ul>

          <div class="status-action">
            <label for="status-select">Changer Statut:</label>
            <select 
              :value="order.status" 
              @change="updateOrderStatus(order.id, $event.target.value)"
              class="status-select"
            >
              <option value="Pending">Pending (En Attente)</option>
              <option value="Processing">Processing (En Cours)</option>
              <option value="Completed">Completed (Terminée)</option>
              <option value="Cancelled">Cancelled (Annulée)</option>
            </select>
            <span :class="['current-status', order.status.toLowerCase()]">{{ order.status }}</span>
          </div>

        </ion-card-content>
      </ion-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/vue';

// --- Imports Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore'; 

// --- CONFIGURATION FIREBASE GLOBALE (RÉ-INITIALISATION PRUDENTE) ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialisation des services
const app = getApps().length 
    ? getApp() 
    : initializeApp(firebaseConfig); 
const db = getFirestore(app);

// --- ÉTATS ---
const allOrders = ref([]);
const isLoading = ref(true);
let unsubscribe = null; 

// --- COMPUTED PROPS ---
const sortedOrders = computed(() => {
    // Tri par date de création, du plus récent au plus ancien
    return [...allOrders.value].sort((a, b) => {
        const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
    });
});

const pendingOrders = computed(() => {
    return allOrders.value.filter(order => order.status === 'Pending');
});

// --- FONCTIONS ---

const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const fetchOrders = () => {
    isLoading.value = true;
    const ordersPath = `/artifacts/${appId}/public/data/orders`;
    const ordersCollection = collection(db, ordersPath);
    
    // Requête pour écouter toutes les commandes (tous les utilisateurs)
    const q = query(ordersCollection, orderBy("createdAt", "desc"));

    unsubscribe = onSnapshot(q, (snapshot) => {
        allOrders.value = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            // Assurez-vous que les détails sont toujours présents pour éviter les erreurs
            details: doc.data().details || {} 
        }));
        isLoading.value = false;
    }, (error) => {
        console.error("Erreur de lecture des commandes:", error);
        isLoading.value = false;
    });
};

const updateOrderStatus = async (orderId, newStatus) => {
    const ordersPath = `/artifacts/${appId}/public/data/orders`;
    const orderRef = doc(db, ordersPath, orderId);

    try {
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: new Date()
        });
        console.log(`Statut de la commande ${orderId.substring(0, 8)} mis à jour à ${newStatus}`);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        alert(`Échec de la mise à jour du statut. Voir console pour plus de détails.`);
    }
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
    fetchOrders();
});

onUnmounted(() => {
    if (unsubscribe) {
        unsubscribe();
    }
});
</script>

<style scoped>
.commandes-display {
  color: #f0f0f0;
   background-color: rgba(0, 0, 0, 0.7);
}

.section-title {
  color: #aa65ebff;
  border-bottom: 2px solid #371b52ff;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.summary-text {
  font-size: 1.1em;
  margin-bottom: 20px;
}

.pending-count {
  font-weight: bold;
  color: #e2ded0ff;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  border: 1px dashed #555;
  border-radius: 8px;
  color: #ccc;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.order-card {
  --background: #252525;
  color: #f0f0f0;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s;
  border-left: 5px solid;
}

.order-card.accessory-order { border-left-color: #8A2BE2; }
.order-card.design-order { border-left-color: #e2ded2ff; }

.order-card.pending { border-color: #e4e2dcff; }
.order-card.processing { border-color: #007bff; }
.order-card.completed { border-color: #28a745; }
.order-card.cancelled { border-color: #dc3545; }

.order-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.order-title.design-order { color: #e9e2cfff; }
.order-title.accessory-order { color: #8A2BE2; }

.order-type {
    font-size: 0.8em;
    font-weight: normal;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 10px;
}

.order-details p {
  margin: 5px 0;
  font-size: 0.95em;
}

.total-amount {
  font-weight: bold;
  color: #7aff7a;
}

.user-id {
  color: #aaa;
  font-style: italic;
}

.items-title {
  color: #ccc;
  border-bottom: 1px dashed #444;
  padding-bottom: 5px;
  margin-top: 15px;
}

.items-list {
  list-style-type: none;
  padding: 0;
  margin: 10px 0 20px 0;
}

.items-list li {
  font-size: 0.9em;
  margin-bottom: 3px;
  color: #ccc;
}

.image-link {
    color: #007bff;
    text-decoration: underline;
    font-weight: bold;
}

.status-action {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-top: 1px solid #444;
}

.status-select {
  padding: 8px;
  border-radius: 4px;
  background: #333;
  color: white;
  border: 1px solid #555;
  flex-grow: 1;
}

.current-status {
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 4px;
}

.current-status.pending { background: #ffc10720; color: #f8f5eaff; }
.current-status.processing { background: #007bff20; color: #007bff; }
.current-status.completed { background: #28a74520; color: #28a745; }
.current-status.cancelled { background: #dc354520; color: #dc3545; }
</style>