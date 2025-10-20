<template>
<ion-page fullscreen class="dashboard-content"
          :style="{ backgroundImage: `url(${carImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'brightness(0.7)' }">
    <ion-header>
      <ion-toolbar style="--background: #2b0f3fff; --color: white;">
        <ion-buttons slot="start">
          <ion-title>👋 Bienvenue !</ion-title>
        </ion-buttons>
        <ion-buttons slot="end" class="header-buttons">
          <ion-button @click="goTo('cart')" class="cart-button">
            <ion-icon :icon="cartOutline"></ion-icon> Panier ({{ cartItems.length }})
          </ion-button>
          <ion-button @click="goTo('purchases')">Mes Achats</ion-button>
          <ion-button @click="logout" color="danger">Déconnexion</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

<ion-content fullscreen class="dashboard-content bg-dashboard">


      <div class="main-user-interface">
        

        <div v-if="!isAuthenticated && !isLoading" class="auth-warning">
          🔒 Vous êtes déconnecté. Veuillez vous reconnecter pour ajouter des produits.
        </div>
        
        <div class="nav-tabs">
          <ion-button 
            @click="currentView = 'accessories'" 
            :class="{ active: currentView === 'accessories' }"
            expand="block"
            class="nav-button"
          >
            🧰 Accessoires ({{ accessories.length }})
          </ion-button>
          <ion-button 
            @click="currentView = 'designs'" 
            :class="{ active: currentView === 'designs' }"
            expand="block"
            class="nav-button"
          >
            🚀 Designs / Couleurs ({{ designs.length }})
          </ion-button>
        </div>

        <hr class="separator">

        <div v-if="statusMessage" :class="['status-message', statusType]">
          {{ statusMessage }}
        </div>

        <div v-if="isLoading" class="loading-state">
          Chargement des données...
        </div>

        <div v-else :class="['product-container', currentView]">
          <h3 class="list-title">{{ currentView === 'accessories' ? 'Accessoires disponibles' : 'Options de Design/Couleur' }}</h3>
          
          <div v-if="currentView === 'accessories' && accessories.length === 0" class="no-items">Aucun accessoire.</div>
          <div v-else-if="currentView === 'designs' && designs.length === 0" class="no-items">Aucun design.</div>

          <div class="product-grid">
            <ion-card 
                v-for="item in (currentView === 'accessories' ? accessories : designs)" 
                :key="item.id" 
                class="product-card"
            >
              <div :class="['image-wrapper', { 'design-wrapper': currentView === 'designs' }]">
                <img :src="item.imageUrl" :alt="item.name" class="product-image" onerror="this.onerror=null;this.src='https://placehold.co/600x400/1F1F1F/8A2BE2?text=Image+Manquante';" />
              </div>
              
              <div class="product-details">
                <ion-card-title class="card-title">{{ item.name }}</ion-card-title>
                <p class="description">{{ item.description }}</p>
                <p class="price-stock">
                  <span class="price">{{ item.price }} €</span>
                  <span v-if="currentView === 'accessories'" class="stock">| Stock: {{ item.stock }}</span>
                </p>

                <ion-button 
                  @click="handleAction(currentView === 'accessories' ? 'add' : 'select', item)" 
                  :class="['action-button', currentView === 'accessories' ? 'add-button' : 'select-button']"
                  expand="block"
                >
                  {{ currentView === 'accessories' ? 'Ajouter au Panier' : 'Sélectionner' }}
                </ion-button>
              </div>
            </ion-card>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-modal :is-open="isCartOpen" @didDismiss="closeCart" :initial-breakpoint="0.95" :breakpoints="[0, 0.95]">
      <ion-header>
        <ion-toolbar style="--background: #2b0f3fff; --color: white;">
          <ion-title>🛒 Votre Panier</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeCart">
              <ion-icon :icon="closeOutline" style="font-size: 1.5em;"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding cart-modal-content">
        
        <div v-if="cartView === 'list'">
          
          <h2 class="cart-sub-title">Articles sélectionnés ({{ cartItems.length }})</h2>
          
          <div v-if="cartItems.length === 0" class="empty-cart">
            Votre panier est vide. Ajoutez des accessoires !
          </div>

          <ion-list lines="full" v-else class="cart-list">
            <ion-item v-for="item in cartItems" :key="item.id" class="cart-item">
              <ion-label>
                <h3>{{ item.name }} (Accessoire)</h3>
                <p class="cart-item-id">ID: {{ item.id }}</p>
              </ion-label>
              <div class="item-actions">
                <span class="cart-price">{{ item.price }} €</span>
                <ion-button @click="removeItemFromCart(item.id)" color="danger" fill="clear">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </div>
            </ion-item>
          </ion-list>
          
          <div class="cart-summary">
            <div class="total-row">
              <strong>TOTAL :</strong>
              <span class="total-amount">{{ cartTotal }} €</span>
            </div>
            
            <ion-button @click="clearCart" :disabled="cartItems.length === 0" color="medium" expand="block" style="margin-top: 15px;">
              Vider le Panier
            </ion-button>
            
            <ion-button @click="goToCheckout" :disabled="cartItems.length === 0" color="success" expand="block" style="margin-top: 10px;">
              Confirmer la commande (Passer à la caisse)
            </ion-button>
          </div>
        </div>

        <div v-else-if="cartView === 'checkout'">
          <h2 class="cart-sub-title">Détails de la Livraison</h2>
          <p class="total-checkout">Montant total: **{{ cartTotal }} €**</p>
          
          <ion-list lines="full" class="checkout-form">
            <ion-item>
              <ion-label position="floating">Nom Complet</ion-label>
              <ion-input v-model="checkoutDetails.fullName" type="text" required></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="floating">Numéro de Téléphone</ion-label>
              <ion-input v-model="checkoutDetails.phoneNumber" type="tel" required></ion-input>
            </ion-item>
          </ion-list>
          
          <h3 class="map-title">3. Sélectionner l'adresse sur la carte</h3>
          <div id="leaflet-map-container" class="map-container-real">
              </div>
          <div v-if="!checkoutDetails.lat" class="map-loading-placeholder">
              <p>Chargement de la carte...</p>
          </div>
          <p v-if="checkoutDetails.lat" class="map-selected-info">
              ✅ Adresse sélectionnée aux coordonnées: **{{ checkoutDetails.lat.toFixed(6) }}, {{ checkoutDetails.lng.toFixed(6) }}**
              <br> (Adresse approximative: {{ checkoutDetails.address }})
          </p>
          <p v-else-if="mapInstance" class="map-placeholder-info">
              Veuillez cliquer sur la carte pour définir votre point de livraison.
          </p>
          
          <ion-button 
            @click="placeOrder" 
            :disabled="isSubmitting || !checkoutDetails.lat" 
            expand="block" 
            color="success" 
            style="margin-top: 30px;"
          >
            <span v-if="!isSubmitting">Finaliser la Commande ({{ cartTotal }} €)</span>
            <span v-else>Soumission en cours...</span>
          </ion-button>
          
          <ion-button @click="cartView = 'list'" fill="clear" expand="block" color="medium">
            ← Retour au Panier
          </ion-button>
          
        </div>

      </ion-content>
    </ion-modal>
    
    <ion-modal :is-open="isDesignModalOpen" @didDismiss="closeDesignModal" :initial-breakpoint="0.95" :breakpoints="[0, 0.95]">
      <ion-header>
        <ion-toolbar style="--background: #2b0f3fff; --color: white;">
          <ion-title>🎨 Commander le Design: {{ selectedDesignItem?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDesignModal">
              <ion-icon :icon="closeOutline" style="font-size: 1.5em;"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding cart-modal-content">
        
        <h2 class="cart-sub-title">Détails de la Commande Directe Design</h2>
        <p class="total-checkout">Coût du Design: **{{ selectedDesignItem?.price.toFixed(2) || 0.00 }} €**</p>
        
        <ion-list lines="full" class="checkout-form">
            <ion-item>
              <ion-label position="floating">Nom Complet</ion-label>
              <ion-input v-model="designModalDetails.fullName" type="text" required></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="floating">Numéro de Téléphone</ion-label>
              <ion-input v-model="designModalDetails.phoneNumber" type="tel" required></ion-input>
            </ion-item>
            
            <h3 class="map-title">1. Photo de votre véhicule (Obligatoire)</h3>
            <p style="font-size: 0.8em; color: #aaa;">Veuillez uploader une photo nette de la voiture à designer.</p>
            <input type="file" @change="handleFileChange" accept="image/*" class="file-input" required>
            <p v-if="designModalDetails.imageFileName" class="map-selected-info">
                ✅ Fichier sélectionné : **{{ designModalDetails.imageFileName }}**
            </p>
            <p v-else style="font-size: 0.8em; color: orange;">
                ⚠️ Aucun fichier sélectionné.
            </p>

        </ion-list>
        
        <h3 class="map-title" style="margin-top: 20px;">2. Adresse de contact (Map)</h3>
        <div id="leaflet-design-map-container" class="map-container-real">
            </div>
        <div v-if="!designModalDetails.lat" class="map-loading-placeholder">
            <p>Chargement de la carte...</p>
        </div>
        <p v-if="designModalDetails.lat" class="map-selected-info">
            ✅ Adresse sélectionnée aux coordonnées: **{{ designModalDetails.lat.toFixed(6) }}, {{ designModalDetails.lng.toFixed(6) }}**
            <br> (Adresse approximative: {{ designModalDetails.address }})
        </p>
        <p v-else-if="designMapInstance" class="map-placeholder-info">
            Veuillez cliquer sur la carte pour définir votre point de contact.
        </p>
        
        <ion-button 
          @click="placeDesignOrder" 
          :disabled="isSubmitting || !isDesignFormValid" 
          expand="block" 
          color="warning" 
          style="margin-top: 30px; --background: #ffc107; --color: #121212;"
        >
          <span v-if="!isSubmitting">Confirmer le Design ({{ selectedDesignItem?.price.toFixed(2) || 0.00 }} €)</span>
          <span v-else>Soumission en cours...</span>
        </ion-button>
        
        <ion-button @click="closeDesignModal" fill="clear" expand="block" color="medium">
          ← Annuler
        </ion-button>
        
      </ion-content>
    </ion-modal>
    
    <ion-modal :is-open="isPurchasesOpen" @didDismiss="closePurchases" :initial-breakpoint="0.95" :breakpoints="[0, 0.95]">
      <ion-header>
        <ion-toolbar style="--background: #2b0f3fff; --color: white;">
          <ion-title>📦 Mes Commandes Passées</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePurchases">
              <ion-icon :icon="closeOutline" style="font-size: 1.5em;"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding cart-modal-content">
        <div v-if="!isAuthenticated" class="empty-cart" style="border-color: #dc3545; color: #dc3545;">
          🔒 Veuillez vous connecter pour voir vos achats.
        </div>
        <div v-else-if="purchases.length === 0" class="empty-cart">
          Vous n'avez pas encore finalisé de commande.
        </div>
        <ion-list lines="full" v-else class="cart-list">
          <ion-item 
            v-for="order in sortedPurchases" 
            :key="order.id" 
            class="cart-item" 
            :detail="true" 
            @click="toggleDetails(order.id)"
          >
            <ion-label>
              <h3>
                Commande #{{ order.id.substring(0, 8) }} 
                <span :style="{ 'color': order.type === 'design-order' ? '#ffc107' : '#8A2BE2', 'font-size': '0.8em' }">
                    ({{ order.type === 'design-order' ? 'DESIGN' : 'ACCESSOIRES' }})
                </span>
              </h3>
              <p style="color: #ccc; font-size: 0.9em;">Date: {{ formatDate(order.createdAt) }}</p>
              <p :style="{ 'font-weight': 'bold', 'color': order.status === 'Completed' ? '#7aff7a' : order.status === 'Pending' ? 'orange' : 'red' }">
                Statut: {{ order.status }}
              </p>
            </ion-label>
            <div class="item-actions">
              <span class="cart-price">{{ order.total.toFixed(2) }} €</span>
            </div>
          </ion-item>

          <div v-if="expandedOrderId && expandedOrder" class="purchase-details-expanded">
            <h4 class="cart-sub-title">Détails de la Commande #{{ expandedOrder.id.substring(0, 8) }}</h4>
            <div class="detail-box">
              <p><strong>Type:</strong> <span :style="{ 'color': expandedOrder.type === 'design-order' ? '#ffc107' : '#8A2BE2' }">{{ expandedOrder.type === 'design-order' ? 'Design Personnalisé' : 'Accessoires' }}</span></p>
              <p><strong>Total:</strong> <span class="total-amount">{{ expandedOrder.total.toFixed(2) }} €</span></p>
              
              <div v-if="expandedOrder.type === 'design-order'">
                  <p><strong>Design Sélectionné:</strong> {{ expandedOrder.items[0]?.name || 'N/A' }}</p>
                  <p v-if="expandedOrder.details.imageUrl">
                      <strong>Photo Voiture:</strong> <a :href="expandedOrder.details.imageUrl" target="_blank" style="color: #8A2BE2;">Voir l'image (Cliquez)</a>
                  </p>
                  <p v-else><strong>Photo Voiture:</strong> Image non soumise ou indisponible.</p>
              </div>
              
              <p><strong>Contact:</strong> {{ expandedOrder.details.fullName }} ({{ expandedOrder.details.phoneNumber }})</p>
              <p><strong>Adresse:</strong> {{ expandedOrder.details.address }}</p>
              
              <template v-if="expandedOrder.type !== 'design-order'">
                  <h5 class="item-list-title">Articles:</h5>
                  <ul>
                    <li v-for="(item, index) in expandedOrder.items" :key="index">
                      - {{ item.name }} ({{ item.price.toFixed(2) }} €)
                    </li>
                  </ul>
              </template>
            </div>
            
            <ion-button 
              @click="deleteOrder(expandedOrder.id)" 
              fill="outline" 
              expand="block" 
              color="danger" 
              style="margin-top: 15px; font-weight: bold;"
            >
              <ion-icon :icon="trashOutline" slot="start"></ion-icon>
              Supprimer la commande
            </ion-button>
            
            <ion-button @click="expandedOrderId = null" fill="clear" expand="block" color="medium">
              Réduire
            </ion-button>
          </div>
        </ion-list>
      </ion-content>
    </ion-modal>
    
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from "vue-router";
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonCard, IonCardTitle, IonIcon, IonModal, IonList, IonItem, IonLabel, 
  IonInput, 
} from '@ionic/vue';
import { cartOutline, trashOutline, closeOutline } from 'ionicons/icons'; 
import carImg from '@/assets/car11.jpg';


// --- Imports Firebase et Storage ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth'; 
import { getFirestore, collection, onSnapshot, addDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore'; 

// --- CONFIGURATION FIREBASE GLOBALE (OBLIGATOIRE) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialisation des services
const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
const db = getFirestore(app);
const auth = getAuth(app);

const router = useRouter();
let unsubscribeAccessories = null;
let unsubscribeDesigns = null;
let unsubscribeCart = null; 
let unsubscribePurchases = null; 

// --- ÉTATS ---
const currentView = ref('accessories');
const accessories = ref([]);
const designs = ref([]);
const isLoading = ref(true);
const isAuthenticated = ref(false); 
const userId = ref(null); 
const statusMessage = ref(''); 
const statusType = ref(''); 

// --- ÉTATS PANIER/COMMANDE ACCESSOIRES ---
const isCartOpen = ref(false);
const cartItems = ref([]);
const cartView = ref('list'); // 'list' ou 'checkout'
const isSubmitting = ref(false);

const checkoutDetails = ref({
    fullName: '',
    phoneNumber: '',
    address: 'Veuillez sélectionner votre adresse sur la carte ci-dessous.',
    lat: null,
    lng: null
});

// ÉTATS COMMANDE DESIGN (NOUVEAU)
const isDesignModalOpen = ref(false);
const selectedDesignItem = ref(null); // L'article design sélectionné
const designModalDetails = ref({
    fullName: '',
    phoneNumber: '',
    address: 'Veuillez sélectionner votre adresse sur la carte ci-dessous.',
    lat: null,
    lng: null,
    // Pour simuler le fichier/upload
    imageFile: null, 
    imageFileName: null,
    imageUrl: null
});

// État de la carte Leaflet DESIGN
const designMapInstance = ref(null);
const designMarkerInstance = ref(null);

const isDesignFormValid = computed(() => {
    return designModalDetails.value.fullName && 
           designModalDetails.value.phoneNumber && 
           designModalDetails.value.lat &&
           designModalDetails.value.imageFile;
});

// ÉTATS POUR LES ACHATS
const isPurchasesOpen = ref(false); 
const purchases = ref([]);      
const expandedOrderId = ref(null); 

// État de la carte Leaflet du PANIER
const mapInstance = ref(null);
const markerInstance = ref(null);

// Calcul du total du panier (filtre les commandes de design car elles sont directes)
const cartTotal = computed(() => {
    return cartItems.value
        .filter(item => item.type !== 'design-order') 
        .reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2);
});

// COMPUTED POUR LES ACHATS
const sortedPurchases = computed(() => {
    // Trier les achats par date de création, du plus récent au plus ancien
    return [...purchases.value].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
});

const expandedOrder = computed(() => {
    return purchases.value.find(p => p.id === expandedOrderId.value);
});

// FONCTIONS UTILES
const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const toggleDetails = (orderId) => {
    expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId;
};

// ==========================================================
// UTILS MAPS (Injection de Leaflet et Initialisation)
// ==========================================================
const loadLeafletResources = () => {
    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }

    return new Promise((resolve) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve(window.L);
            };
            script.onerror = () => {
                console.error("Échec du chargement de Leaflet.");
                resolve(null);
            };
            document.head.appendChild(script);
        } else {
             const existingScript = document.getElementById('leaflet-js');
             if (existingScript.dataset.loaded) {
                 resolve(window.L);
             } else {
                 existingScript.onload = () => resolve(window.L);
             }
        }
    });
};

// Fonction générique d'initialisation de la carte (peut être réutilisée pour le design)
const initializeMap = async (containerId, detailsRef, mapRef, markerRef) => {
    const L = await loadLeafletResources();
    if (!L) {
        console.error("Leaflet n'est pas disponible pour initialiser la carte.");
        return;
    }

    const mapContainer = document.getElementById(containerId);
    if (!mapContainer || mapRef.value) {
        return; 
    }

    const defaultLat = detailsRef.value.lat || 48.8566; 
    const defaultLng = detailsRef.value.lng || 2.3522;

    mapRef.value = L.map(containerId).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.value);
    
    markerRef.value = L.marker([defaultLat, defaultLng]).addTo(mapRef.value)
        .bindPopup("Point de contact.").openPopup();

    mapRef.value.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        detailsRef.value.lat = lat;
        detailsRef.value.lng = lng;
        detailsRef.value.address = `Recherche d'adresse en cours...`;

        markerRef.value.setLatLng([lat, lng]);

        const reverseGeocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        try {
            const response = await fetch(reverseGeocodingUrl);
            const data = await response.json();
            detailsRef.value.address = data.display_name || `Adresse non trouvée. Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (err) {
            detailsRef.value.address = `Échec de la recherche d'adresse. Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    });

    setTimeout(() => {
        if (mapRef.value) {
            mapRef.value.invalidateSize();
            mapRef.value.setView([defaultLat, defaultLng], 13);
        }
    }, 200);
};

// Fonction pour l'upload de fichier (simulé)
const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        designModalDetails.value.imageFile = file; // Objet File (non sérialisable)
        designModalDetails.value.imageFileName = file.name;
        // Simuler l'URL pour la sauvegarde dans Firestore.
        designModalDetails.value.imageUrl = `SIMULATED_URL/${userId.value}/${file.name}_${Date.now()}`;
    } else {
        designModalDetails.value.imageFile = null;
        designModalDetails.value.imageFileName = null;
        designModalDetails.value.imageUrl = null;
    }
};

// ==========================================================
// FONCTIONS FIREBASE
// ==========================================================

// 1. Récupérer les produits (Accessoires et Designs)
const fetchProducts = () => {
    const accessoriesCol = collection(db, 'accessories');
    const designsCol = collection(db, 'designs');
    
    let accessoriesLoaded = false;
    let designsLoaded = false;
    
    const checkLoadingStatus = (accLoaded, desLoaded) => {
        if (accLoaded && desLoaded) {
            isLoading.value = false;
        }
    }
    
    unsubscribeAccessories = onSnapshot(accessoriesCol, (snapshot) => {
        accessories.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        accessoriesLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    }, (error) => {
        console.error("Erreur de lecture des accessoires:", error);
        accessoriesLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    });

    unsubscribeDesigns = onSnapshot(designsCol, (snapshot) => {
        designs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        designsLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    }, (error) => {
        console.error("Erreur de lecture des designs:", error);
        designsLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    });
};

// 2. Récupérer le contenu du panier de l'utilisateur
const fetchCart = () => {
    if (!userId.value) return;

    if (unsubscribeCart) { unsubscribeCart(); }

    const userCartPath = `/artifacts/${appId}/users/${userId.value}/cart`;
    const cartCollection = collection(db, userCartPath);

    unsubscribeCart = onSnapshot(cartCollection, (snapshot) => {
        // Le panier ne doit contenir QUE les accessoires (type !== 'design-order')
        cartItems.value = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.type !== 'design-order'); // Filtrage
    }, (error) => {
        console.error("Erreur de lecture du panier:", error);
    });
};

// 3. Récupérer les achats (commandes passées) de l'utilisateur
const fetchPurchases = () => {
    if (!userId.value) return;

    if (unsubscribePurchases) { unsubscribePurchases(); }

    // Chemin d'accès à la collection d'ordres publics
    const ordersPath = `/artifacts/${appId}/public/data/orders`;
    const ordersCollection = collection(db, ordersPath);

    // Écoute en temps réel des commandes
    unsubscribePurchases = onSnapshot(ordersCollection, (snapshot) => {
        // Filtrer les commandes pour ne garder que celles de l'utilisateur actuel
        purchases.value = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(order => order.userId === userId.value); 
            
    }, (error) => {
        console.error("Erreur de lecture des achats:", error);
    });
};


// 4. Fonction pour SUPPRIMER une commande
const deleteOrder = async (orderId) => {
    if (!userId.value) return;

    if (!confirm(`Êtes-vous sûr de vouloir annuler et supprimer la commande #${orderId.substring(0, 8)} ? Cette action est irréversible.`)) {
        return;
    }

    try {
        const ordersPath = `/artifacts/${appId}/public/data/orders`;
        const orderRef = doc(db, ordersPath, orderId);

        await deleteDoc(orderRef);

        expandedOrderId.value = null;

        statusMessage.value = `🗑️ Commande #${orderId.substring(0, 8)} a été supprimée.`;
        statusType.value = 'success';
        
    } catch (error) {
        statusMessage.value = `❌ Erreur lors de la suppression de la commande.`;
        statusType.value = 'error';
        console.error("Erreur Firestore lors de la suppression de la commande:", error);
    }
    setTimeout(() => { statusMessage.value = ''; }, 4000);
};


// Fonction de gestion de l'action sur les produits
const handleAction = async (action, item) => {
    statusMessage.value = '';
    statusType.value = '';

    if (!isAuthenticated.value || !userId.value) {
        statusMessage.value = "⛔ Veuillez vous connecter pour effectuer cette action.";
        statusType.value = 'error';
        setTimeout(() => { statusMessage.value = ''; }, 4000);
        return;
    }

    if (action === 'add') { // Accessoires : ajout au panier
        try {
             const userCartPath = `/artifacts/${appId}/users/${userId.value}/cart`;
             const cartCollection = collection(db, userCartPath);

             const itemData = {
                 name: item.name,
                 productId: item.id,
                 price: item.price,
                 imageUrl: item.imageUrl,
                 type: 'accessory', // Type 'accessory' pour le panier
                 timestamp: new Date()
             };
             await addDoc(cartCollection, itemData);
             statusMessage.value = `✅ ${item.name} a été ajouté à votre configuration!`;
             statusType.value = 'success';
        } catch (error) {
            statusMessage.value = `❌ Erreur lors de l'ajout au panier.`;
            statusType.value = 'error';
            console.error("Erreur Firestore lors de l'ajout au panier:", error);
        }
    } else if (action === 'select') { // Designs : ouverture du formulaire de commande directe
        selectedDesignItem.value = item;
        // Réinitialiser les détails spécifiques au design et à la carte
        designModalDetails.value = {
            fullName: '',
            phoneNumber: '',
            address: 'Veuillez sélectionner votre adresse sur la carte ci-dessous.',
            lat: null,
            lng: null,
            imageFile: null,
            imageFileName: null,
            imageUrl: null
        };
        isDesignModalOpen.value = true;
        // Initialiser la carte Leaflet de la modale de design
        setTimeout(() => {
            initializeMap('leaflet-design-map-container', designModalDetails, designMapInstance, designMarkerInstance);
        }, 50);
        
    }
    setTimeout(() => { statusMessage.value = ''; }, 3000);
};

// Supprimer un élément du panier (seulement pour les accessoires)
const removeItemFromCart = async (docId) => {
    if (!userId.value) return;
    try {
        const itemRef = doc(db, `/artifacts/${appId}/users/${userId.value}/cart`, docId);
        await deleteDoc(itemRef);
        
        statusMessage.value = 'Item retiré du panier.';
        statusType.value = 'success';
    } catch (error) {
        statusMessage.value = `❌ Erreur de suppression.`;
        statusType.value = 'error';
        console.error("Erreur Firestore lors de la suppression:", error);
    }
    setTimeout(() => { statusMessage.value = ''; }, 3000);
}

// Vider tout le panier (seulement les accessoires)
const clearCart = async () => {
    if (!userId.value || cartItems.value.length === 0) return;
    
    try {
        const batch = writeBatch(db);
        cartItems.value.forEach(item => {
            // S'assurer de ne supprimer que les accessoires dans le panier
            if (item.type === 'accessory') {
                batch.delete(doc(db, `/artifacts/${appId}/users/${userId.value}/cart`, item.id));
            }
        });
        await batch.commit();

        statusMessage.value = '✅ Panier vidé avec succès.';
        statusType.value = 'success';

    } catch (error) {
        statusMessage.value = '❌ Erreur lors du vidage du panier.';
        statusType.value = 'error';
        console.error("Erreur Firestore lors du vidage du panier:", error);
    }
    setTimeout(() => { statusMessage.value = ''; }, 4000);
}

// Placer la commande d'accessoires
const placeOrder = async () => {
    if (!userId.value || cartItems.value.length === 0) return;
    if (isSubmitting.value || !checkoutDetails.value.lat || !checkoutDetails.value.fullName) return;

    isSubmitting.value = true;
    statusMessage.value = '⏳ Finalisation de la commande...';
    statusType.value = 'info';

    try {
        // 1. Créer l'objet de commande
        const orderData = {
            userId: userId.value,
            total: parseFloat(cartTotal.value),
            createdAt: new Date(),
            status: 'Pending',
            type: 'accessory-order',
            items: cartItems.value.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl,
            })),
            details: {
                fullName: checkoutDetails.value.fullName,
                phoneNumber: checkoutDetails.value.phoneNumber,
                address: checkoutDetails.value.address,
                lat: checkoutDetails.value.lat,
                lng: checkoutDetails.value.lng,
            },
        };

        // 2. Écrire la commande dans la collection publique des commandes
        const ordersPath = `/artifacts/${appId}/public/data/orders`;
        await addDoc(collection(db, ordersPath), orderData);

        // 3. Vider le panier après la commande (supprimer les documents du panier)
        const batch = writeBatch(db);
        cartItems.value.forEach(item => {
            if (item.type === 'accessory') { // S'assurer de vider uniquement les accessoires
                batch.delete(doc(db, `/artifacts/${appId}/users/${userId.value}/cart`, item.id));
            }
        });
        await batch.commit();

        // 4. Succès et nettoyage
        statusMessage.value = `🎉 Commande de ${cartTotal.value} € passée avec succès!`;
        statusType.value = 'success';
        
        isCartOpen.value = false;
        cartView.value = 'list'; // Retour à la liste du panier par défaut

    } catch (error) {
        statusMessage.value = `❌ Erreur Firestore lors de la commande: ${error.message}`;
        statusType.value = 'error';
        console.error("Erreur Firestore lors de la commande:", error);
    } finally {
        isSubmitting.value = false;
        setTimeout(() => { statusMessage.value = ''; }, 5000);
    }
};

// ==========================================================
// CORRECTION DE L'ERREUR DANS placeDesignOrder (ET LOGIQUE D'AFFICHAGE)
// ==========================================================
const placeDesignOrder = async () => {
    statusMessage.value = '';
    statusType.value = '';

    // CORRECTION: Vérifier que selectedDesignItem n'est pas null
    if (!selectedDesignItem.value) {
        statusMessage.value = "❌ Erreur critique: Le design sélectionné est manquant.";
        statusType.value = 'error';
        console.error("Erreur: selectedDesignItem est null au moment de la commande.");
        setTimeout(() => { statusMessage.value = ''; }, 4000);
        return; 
    }
    
    if (!isDesignFormValid.value || isSubmitting.value) {
        statusMessage.value = "⚠️ Veuillez remplir tous les champs (Nom, Téléphone, Photo) et sélectionner l'adresse sur la carte.";
        statusType.value = 'warning';
        setTimeout(() => { statusMessage.value = ''; }, 4000);
        return;
    }

    isSubmitting.value = true;
    statusMessage.value = '⏳ Soumission de la commande de design...';
    statusType.value = 'info';

    try {
        // Simuler un délai d'upload pour le fichier
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const orderData = {
            userId: userId.value,
            total: selectedDesignItem.value.price || 0,
            createdAt: new Date(),
            status: 'Pending',
            type: 'design-order',
            items: [{ // Le design est l'unique "article" ici
                productId: selectedDesignItem.value.id,
                name: selectedDesignItem.value.name,
                price: selectedDesignItem.value.price,
                imageUrl: selectedDesignItem.value.imageUrl,
            }],
            details: {
                fullName: designModalDetails.value.fullName,
                phoneNumber: designModalDetails.value.phoneNumber,
                address: designModalDetails.value.address,
                lat: designModalDetails.value.lat,
                lng: designModalDetails.value.lng,
                imageUrl: designModalDetails.value.imageUrl, // L'URL simulée ou réelle
            },
        };

        const ordersPath = `/artifacts/${appId}/public/data/orders`;
        await addDoc(collection(db, ordersPath), orderData);

        // Succès et nettoyage
        
        // 1. Définir le message de succès sur le dashboard
        statusMessage.value = `🎉 Design **${selectedDesignItem.value.name}** commandé!`;
        statusType.value = 'success';
        
        // 2. Réinitialisation et fermeture de la modale
        selectedDesignItem.value = null; // Réinitialisation APRÈS l'utilisation
        closeDesignModal(); // Ferme la modale de design
        // Ligne RETIRÉE : isPurchasesOpen.value = true; 

    } catch (error) {
        statusMessage.value = `❌ Erreur Firestore lors de la commande de design: ${error.message}`;
        statusType.value = 'error';
        console.error("Erreur Firestore lors de la commande de design:", error);
    } finally {
        isSubmitting.value = false;
        setTimeout(() => { statusMessage.value = ''; }, 4000);
    }
};

// ==========================================================
// GESTION DES MODALES ET AUTHENTIFICATION
// ==========================================================
const goTo = (target) => {
    if (target === 'cart') {
        isCartOpen.value = true;
        isPurchasesOpen.value = false;
        isDesignModalOpen.value = false;
        // Initialiser la carte Leaflet du panier à l'ouverture du checkout
        if (cartView.value === 'checkout') {
            setTimeout(() => {
                initializeMap('leaflet-map-container', checkoutDetails, mapInstance, markerInstance);
            }, 50);
        }
    } else if (target === 'purchases') {
        isPurchasesOpen.value = true;
        isCartOpen.value = false;
        isDesignModalOpen.value = false;
    }
};

const goToCheckout = () => {
    cartView.value = 'checkout';
    setTimeout(() => {
        // S'assurer que le DOM est à jour avant d'initialiser Leaflet
        initializeMap('leaflet-map-container', checkoutDetails, mapInstance, markerInstance);
    }, 50);
}

const closeCart = () => {
    isCartOpen.value = false;
    cartView.value = 'list'; // Reset to list view on close
}

const closePurchases = () => {
    isPurchasesOpen.value = false;
    expandedOrderId.value = null; // Réduire les détails à la fermeture
}

const closeDesignModal = () => {
    isDesignModalOpen.value = false;
    // Nettoyage des instances de carte si elles existent
    if (designMapInstance.value) {
        designMapInstance.value.remove();
        designMapInstance.value = null;
        designMarkerInstance.value = null;
    }
};

const logout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Erreur de déconnexion:", error);
    }
};

// ==========================================================
// LIFECYCLE HOOKS
// ==========================================================

onMounted(async () => {
    // 1. Gérer l'authentification (si un token initial est présent)
    if (initialAuthToken) {
        try {
            await signInWithCustomToken(auth, initialAuthToken);
        } catch (error) {
            console.error("Erreur de connexion par token:", error);
        }
    }

    // 2. Écouter les changements d'état d'authentification
    onAuthStateChanged(auth, (user) => {
        isAuthenticated.value = !!user;
        userId.value = user ? user.uid : null;

        // 3. Charger les données si l'utilisateur est authentifié
        if (user) {
            fetchCart();
            fetchPurchases();
        } else {
            // Nettoyer les données si déconnecté
            cartItems.value = [];
            purchases.value = [];
            if (unsubscribeCart) { unsubscribeCart(); }
            if (unsubscribePurchases) { unsubscribePurchases(); }
        }
    });

    // 4. Charger les produits (même si non authentifié)
    fetchProducts();
});

onUnmounted(() => {
    // Nettoyage des écouteurs Firestore
    if (unsubscribeAccessories) { unsubscribeAccessories(); }
    if (unsubscribeDesigns) { unsubscribeDesigns(); }
    if (unsubscribeCart) { unsubscribeCart(); }
    if (unsubscribePurchases) { unsubscribePurchases(); }

    // Nettoyage des instances de carte
    if (mapInstance.value) {
        mapInstance.value.remove();
    }
    if (designMapInstance.value) {
        designMapInstance.value.remove();
    }
});
</script>

<style scoped>
/* Le style CSS n'a pas été modifié */

.dashboard-content {
  --background: #1e1e1e;
  color: white;
}

.main-user-interface {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.dashboard-content {
  background-image: url('assets/car11.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}


.main-title, .subtitle {
  text-align: center;
  margin-bottom: 10px;
}

.main-title {
  color: #8A2BE2; /* Bleu-Violet */
}

.auth-warning {
  background: #dc354530;
  color: #dc3545;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.nav-button {
  --background: #333;
  --color: white;
  flex: 1;
}

.dashboard-content {

  background-image: url('/assets/car11.jpg'); 
  background-size: cover;       
  background-position: center;  
  background-repeat: no-repeat; 
  min-height: 100vh;            
  width: 100%;
}

.dashboard-content::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.4); /* diminue luminosité */
  z-index: 0;
}

.nav-button.active {
  --background: #8A2BE2;
  font-weight: bold;
}

.separator {
  border: 0;
  height: 1px;
  background: #444;
  margin: 20px 0;
}

.status-message {
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: bold;
  text-align: center;
}

.status-message.success {
  background-color: #28a74530;
  color: #28a745;
}
.bg-dashboard {
  background-image: url('assets/images/car11.jpg') !important;
  background-size: cover !important;
  background-position: center !important;
}


.status-message.error {
  background-color: #dc354530;
  color: #dc3545;
}

.status-message.info {
  background-color: #007bff30;
  color: #007bff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  --background: #333;
  color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.image-wrapper {
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.bg-dashboard {
  background-image: url(~@/assets/car11.jpg); /* ou carImg si tu veux via JS */
  background-size: cover;   /* couvre tout le conteneur */
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;       /* s'assure que ça prend toute la page */
  width: 100%;
}


.card-title {
  font-size: 1.2em;
  color: #8A2BE2;
  margin-bottom: 5px;
}

.description {
  font-size: 0.9em;
  color: #ccc;
  flex-grow: 1;
  margin-bottom: 10px;
}

.price-stock {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1em;
  margin-bottom: 15px;
}

.price {
  font-weight: bold;
  color: #7aff7a; /* Vert clair pour le prix */
}

.stock {
  color: orange;
  font-size: 0.9em;
}

.action-button {
  font-weight: bold;
  text-transform: uppercase;
}

.add-button {
  --background: #8A2BE2;
}

.select-button {
  --background: #ffc107;
  --color: #121212;
}

/* Styles Modales */
.cart-modal-content {
  --background: #1e1e1e;
  color: white;
}
/* style.css ou style scoped du composant */
.bg-dashboard {
  --background: transparent; /* Pour désactiver le background par défaut d'Ionic */
  position: relative;
}

.bg-dashboard::part(scroll) {
  background-image: url('/assets/car11.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.cart-sub-title {
  color: #8A2BE2;
  margin-bottom: 15px;
  border-bottom: 2px solid #444;
  padding-bottom: 5px;
}

.empty-cart {
  padding: 20px;
  border: 1px dashed #444;
  text-align: center;
  color: #aaa;
  border-radius: 8px;
}

.cart-list {
  background: #252525;
  border-radius: 8px;
  margin-bottom: 20px;
}

.cart-item {
  --background: #252525;
  --color: white;
  border-bottom: 1px solid #333;
}

.cart-item-id {
  font-size: 0.75em;
  color: #666;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-price {
  font-weight: bold;
  color: #7aff7a;
}

.cart-summary {
  padding: 10px;
  background: #333;
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.2em;
  padding: 5px 0;
  margin-bottom: 10px;
}

.total-amount {
  color: #7aff7a;
  font-weight: bold;
}

.total-checkout {
  font-size: 1.1em;
  color: #ffc107;
  margin-bottom: 20px;
}

/* Checkout Form & Map */
.checkout-form {
  --background: #252525;
  border-radius: 8px;
  margin-bottom: 20px;
}

.checkout-form ion-item {
  --background: #252525;
  --color: white;
}

.map-title {
  color: #8A2BE2;
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.map-container-real {
  height: 250px;
  width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #222;
  overflow: hidden;
}

.map-loading-placeholder {
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #222;
  color: #999;
  border-radius: 8px;
}

.map-selected-info {
  padding: 10px;
  background: #28a74530;
  color: #28a745;
  border-radius: 6px;
  font-size: 0.9em;
}

.map-placeholder-info {
  padding: 10px;
  background: #007bff30;
  color: #007bff;
  border-radius: 6px;
  font-size: 0.9em;
}

.purchase-details-expanded {
  padding: 15px;
  background: #333;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #8A2BE2;
}

.detail-box p {
  margin: 5px 0;
  font-size: 0.95em;
  color: #ccc;
}

.item-list-title {
  color: #ffc107;
  margin-top: 10px;
  margin-bottom: 5px;
}

.detail-box ul {
  list-style: disc;
  margin-left: 20px;
  padding: 0;
  font-size: 0.9em;
}

.file-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #444;
    border-radius: 4px;
    background-color: #333;
    color: white;
    margin-bottom: 15px;
}
</style>