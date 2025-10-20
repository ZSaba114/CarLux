<template>
  <div class="main-user-interface">
    
    <!-- HEADER DE NAVIGATION (CarLux) -->
    <header class="app-header">
      <div class="logo">
        <span class="logo-text">⚡ CarLux</span>
      </div>
      <nav class="auth-nav">
        <!-- Home vers /home (REDIGE VRAIMENT) -->
        <a href="/home" class="nav-link home-link">Home</a>
        
        <!-- Sign Up vers /signup (REDIGE VRAIMENT) -->
        <a href="/signup" class="nav-link signup-btn">Sign Up</a>
        
        <!-- Sign In vers /login (REDIGE VRAIMENT) -->
        <a href="/login" class="nav-link signin-btn">Sign In</a>
      </nav>
    </header>

    <h2 class="main-title">🛍️ Configuration Produit</h2>
    <p class="subtitle">Sélectionnez les composants souhaités pour votre commande.</p>

    <!-- NAVIGATION TABS -->
    <div class="nav-tabs">
      <ion-button 
        @click="currentView = 'accessories'" 
        :class="{ active: currentView === 'accessories' }"
        expand="block"
        class="nav-button"
      >
        Accessoires ({{ accessories.length }})
      </ion-button>
      <ion-button 
        @click="currentView = 'designs'" 
        :class="{ active: currentView === 'designs' }"
        expand="block"
        class="nav-button"
      >
        Designs / Couleurs ({{ designs.length }})
      </ion-button>
    </div>

    <hr class="separator">

    <!-- LOADING/EMPTY STATE -->
    <div v-if="isLoading" class="loading-state">
      Chargement des données...
    </div>
    
    <!-- AVERTISSEMENT D'AUTHENTIFICATION (Affiché si non connecté et chargement terminé) -->
    <div v-if="!isAuthenticated && !isLoading" class="auth-warning">
      🔒 Veuillez vous connecter pour ajouter ou sélectionner des produits.
    </div>

    <!-- Message de confirmation ou d'erreur -->
    <div v-if="statusMessage" :class="['status-message', statusType]">
      {{ statusMessage }}
    </div>

    <!-- -------------------------- -->
    <!-- AFFICHAGE DES ACCESSOIRES -->
    <!-- -------------------------- -->
    <div v-else-if="currentView === 'accessories'" class="product-container">
      <h3 class="list-title">Accessoires disponibles</h3>
      
      <div v-if="accessories.length === 0" class="no-items">
        Aucun accessoire n'a été ajouté par l'administrateur.
      </div>
      
      <!-- Utilisation de CSS Grid pour 4 éléments par ligne -->
      <div class="product-grid">
        <ion-card v-for="item in accessories" :key="item.id" class="product-card">
          <!-- Image -->
          <div class="image-wrapper">
            <img :src="item.imageUrl" :alt="item.name" class="product-image" />
          </div>
          
          <div class="product-details">
            <ion-card-title class="card-title">{{ item.name }}</ion-card-title>
            <p class="description">{{ item.description }}</p>
            <p class="price-stock">
              <span class="price">{{ item.price }} €</span>
              <span class="stock">| Stock: {{ item.stock }}</span>
            </p>

            <!-- Bouton "Add" (Ajouter) -->
            <ion-button 
              @click="handleAction('add', item)" 
              class="action-button add-button"
              expand="block"
            >
              Ajouter
            </ion-button>
          </div>
        </ion-card>
      </div>
    </div>

    <!-- -------------------------- -->
    <!-- AFFICHAGE DES DESIGNS -->
    <!-- -------------------------- -->
    <div v-else-if="currentView === 'designs'" class="product-container">
      <h3 class="list-title">Options de Design/Couleur</h3>
      
      <div v-if="designs.length === 0" class="no-items">
        Aucun design n'a été ajouté par l'administrateur.
      </div>

      <!-- Utilisation de CSS Grid pour 4 éléments par ligne -->
      <div class="product-grid">
        <ion-card v-for="item in designs" :key="item.id" class="product-card">
          <!-- Image (Ici on garde le style rond pour le design) -->
          <div class="image-wrapper design-wrapper">
            <img :src="item.imageUrl" :alt="item.name" class="product-image design-image" />
          </div>
          
          <div class="product-details">
            <ion-card-title class="card-title">{{ item.name }}</ion-card-title>
            <p class="description">{{ item.description }}</p>
            <p class="price-stock">
              <span class="price">{{ item.price }} €</span>
            </p>

            <!-- Bouton "Select" (Sélectionner) -->
            <ion-button 
              @click="handleAction('select', item)" 
              class="action-button select-button"
              expand="block"
            >
              Sélectionner
            </ion-button>
          </div>
        </ion-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  IonButton, 
  IonCard, 
  IonCardTitle, 
} from '@ionic/vue';

// --- Imports Firebase ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// --- CONFIGURATION FIREBASE GLOBALE (OBLIGATOIRE) ---
// Récupération des variables globales de l'environnement Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialisation des services (pour éviter l'erreur de doublon)
const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp(); 
    
const db = getFirestore(app);
const auth = getAuth(app);

// Variables pour les listeners Firestore
let unsubscribeAccessories = null;
let unsubscribeDesigns = null;

// --- ÉTATS ---
const currentView = ref('accessories');
const accessories = ref([]);
const designs = ref([]);
const isLoading = ref(true);
const isAuthenticated = ref(false); 
const userId = ref(null); 
const statusMessage = ref(''); // Message de confirmation/erreur
const statusType = ref(''); // 'success' ou 'error'

const fetchProducts = () => {
    // Les collections sont publiques et sont le même chemin pour tout le monde
    const accessoriesCol = collection(db, 'accessories');
    
    // 1. Récupération des Accessoires
    let accessoriesLoaded = false;
    let designsLoaded = false;
    
    unsubscribeAccessories = onSnapshot(accessoriesCol, (snapshot) => {
        accessories.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        accessoriesLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    }, (error) => {
        console.error("Erreur de lecture des accessoires:", error);
        accessoriesLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    });

    // 2. Récupération des Designs
    const designsCol = collection(db, 'designs');
    unsubscribeDesigns = onSnapshot(designsCol, (snapshot) => {
        designs.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        designsLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    }, (error) => {
        console.error("Erreur de lecture des designs:", error);
        designsLoaded = true;
        checkLoadingStatus(accessoriesLoaded, designsLoaded);
    });
};

const checkLoadingStatus = (accLoaded, desLoaded) => {
    // Le chargement est terminé quand les deux sont chargés (même si le tableau est vide)
    if (accLoaded && desLoaded) {
        isLoading.value = false;
    }
}

onMounted(async () => { 
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        }
    } catch (e) {
        console.error("Échec de l'authentification Firebase lors du signIn:", e);
    }
    
    // Attache le listener d'état d'authentification et déclenche le chargement des produits
    onAuthStateChanged(auth, (user) => {
        isAuthenticated.value = !!user;
        userId.value = user ? user.uid : null;
        fetchProducts(); 
    });
});

onUnmounted(() => { 
    // Nettoyage des listeners lors de la destruction du composant
    if (unsubscribeAccessories) { unsubscribeAccessories(); }
    if (unsubscribeDesigns) { unsubscribeDesigns(); }
});


// --- LOGIQUE DES BOUTONS AVEC AJOUT AU PANIER ---
const handleAction = async (action, item) => {
  statusMessage.value = '';
  statusType.value = '';

  // 1. VÉRIFICATION DE L'AUTHENTIFICATION (Redirection si non connecté)
  if (!isAuthenticated.value || !userId.value) {
    statusMessage.value = "⛔ Veuillez vous connecter pour effectuer cette action.";
    statusType.value = 'error';
    window.location.href = '/login';
    return;
  }

  // 2. LOGIQUE D'AJOUT AU PANIER (Collection 'cart' privée)
  try {
    const userCartPath = `/artifacts/${appId}/users/${userId.value}/cart`;
    const cartCollection = collection(db, userCartPath);

    // Préparation des données de l'article pour le panier
    const itemData = {
        name: item.name,
        productId: item.id,
        price: item.price,
        imageUrl: item.imageUrl,
        type: currentView.value === 'accessories' ? 'accessory' : 'design',
        timestamp: new Date()
    };
    
    // Ajout du document dans la collection du panier de l'utilisateur
    await addDoc(cartCollection, itemData);

    // Affichage d'un message de succès
    statusMessage.value = `✅ ${item.name} a été ajouté à votre configuration!`;
    statusType.value = 'success';
    console.log(`[SUCCÈS FIRESTORE] Item ajouté au panier de l'utilisateur ${userId.value}. Chemin: ${userCartPath}`);

  } catch (error) {
    // Affichage d'un message d'erreur
    statusMessage.value = `❌ Erreur lors de l'ajout de ${item.name} au panier.`;
    statusType.value = 'error';
    console.error("Erreur Firestore lors de l'ajout au panier:", error);
  }
};

</script>

<style scoped>
/*
|----------------------------------------------------
| PALETTE DE COULEURS
| Fond principal: #121212 (Noir Profond)
| Accentuation: #8A2BE2 (Violet Vif/Blue Violet)
| Texte Secondaire: #FFFFFF (Blanc)
|----------------------------------------------------
*/

/* NOUVEAUX STYLES POUR LE HEADER */
.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #333; 
}

.logo-text {
    font-size: 1.5em;
    font-weight: 900;
    color: #8A2BE2; /* Violet pour le logo */
    letter-spacing: 1px;
}

.auth-nav {
    display: flex;
    gap: 10px;
}

/* NOUVEAU STYLE GÉNÉRIQUE POUR LES LIENS <a> DANS LE HEADER */
.nav-link {
    display: inline-flex; /* Pour qu'il se comporte comme un bouton */
    align-items: center;
    justify-content: center;
    text-decoration: none; /* Supprimer le soulignement par défaut */
    
    padding: 8px 15px; /* Rendre le lien plus grand */
    border-radius: 6px; 
    font-size: 0.9em;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    line-height: 1; 
    border: 2px solid transparent; /* Pour éviter le décalage lors du hover */
}

.home-link {
    color: #ccc; /* Gris clair pour Home */
}

.signup-btn {
    background: transparent;
    border-color: #8A2BE2; /* Bordure Violette pour Sign Up (outline) */
    color: #8A2BE2;
}

.signin-btn {
    background: #8A2BE2; /* Violet Vif pour Sign In (solid) */
    color: white;
    border-color: #8A2BE2;
}
/* FIN NOUVEAUX STYLES POUR LE HEADER */


/* Conteneur principal */
.main-user-interface {
    padding: 20px;
    background-color: #121212; 
    min-height: 100vh;
    color: white;
}

.main-title {
    color: #fff;
    text-align: center;
    margin-bottom: 5px;
}

.subtitle {
    color: #ccc;
    text-align: center;
    margin-bottom: 20px;
}

.separator {
    border: none;
    height: 1px;
    /* Dégradé avec le violet pour la séparation */
    background: linear-gradient(to right, #8A2BE2, #333, #8A2BE2); 
    margin: 20px 0;
}

/* NAVIGATION TABS */
.nav-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.nav-button {
    flex: 1;
    --background: #333; 
    --color: #fff;
    --border-radius: 8px;
    --ripple-color: #8A2BE2; /* Ripple en Violet */
}

.nav-button.active {
    --background: #8A2BE2; /* Violet Vif pour l'actif */
    --color: #fff;
    font-weight: bold;
    border: 1px solid #fff; /* Bordure Blanche pour l'actif */
}


/* TITRE DE LA LISTE */
.list-title {
    color: #8A2BE2; /* Violet */
    margin-top: 25px;
    padding-bottom: 5px;
    border-bottom: 1px solid #333;
}

/* GRILLE PRODUIT */
.product-grid {
    display: grid;
    /* Par défaut, 1 colonne sur petit écran */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 20px;
    margin-top: 20px;
}

/* MEDIA QUERIES pour 2, 3 et 4 colonnes */
@media (min-width: 600px) {
    .product-grid {
        grid-template-columns: repeat(2, 1fr); /* 2 colonnes sur tablette */
    }
}
@media (min-width: 900px) {
    .product-grid {
        grid-template-columns: repeat(3, 1fr); /* 3 colonnes */
    }
}
@media (min-width: 1200px) {
    .product-grid {
        grid-template-columns: repeat(4, 1fr); /* 4 colonnes sur desktop */
    }
}


/* CARDS DE PRODUIT */
.product-card {
    background: #1F1F1F; 
    color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    padding: 0; 
    border: 1px solid #333;
    display: flex; 
    flex-direction: column;
}

.image-wrapper {
    width: 100%;
    aspect-ratio: 4 / 3; 
    overflow: hidden;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom: 2px solid #8A2BE2; /* Bordure en Violet */
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

/* Détails du produit */
.product-details {
    padding: 15px;
    display: flex;
    flex-direction: column;
    flex-grow: 1; 
}

.card-title {
    font-size: 1.1em;
    font-weight: bold;
    color: #FFFFFF; /* Titre en Blanc */
    margin-bottom: 5px;
}

.description {
    color: #ccc;
    font-size: 0.85em;
    margin-bottom: 10px;
    height: 3em; 
    overflow: hidden;
    text-overflow: ellipsis;
}

.price-stock {
    display: block;
    margin-bottom: 15px;
    margin-top: auto; 
}
.price {
    font-weight: bold;
    color: #8A2BE2; /* Prix en Violet */
    font-size: 1.1em;
}
.stock {
    color: #888;
    font-size: 0.9em;
}

/* Styles spécifiques au design (couleur) */
.design-wrapper {
    aspect-ratio: 16 / 9; 
    border-bottom: 2px solid #8A2BE2; /* Bordure Violette */
}
.design-image {
    object-fit: contain; 
    border-radius: 0;
}


/* BOUTONS D'ACTION */
.action-button {
    --border-radius: 6px;
    font-weight: bold;
    margin-top: 10px;
}

/* Bouton Ajouter (Accessoires) */
.add-button {
    --background: #8A2BE2; /* Violet */
    --color: white;
    --ripple-color: #fff;
}

/* Bouton Sélectionner (Designs) */
.select-button {
    --background: #fff; /* Blanc */
    --color: #121212; /* Texte noir sur Blanc */
    --ripple-color: #8A2BE2;
}

.loading-state, .no-items {
    text-align: center;
    padding: 30px;
    color: #8A2BE2; /* Texte en Violet */
    background-color: #1F1F1F;
    border: 1px dashed #8A2BE2;
    border-radius: 8px;
    margin-top: 20px;
}

/* Avertissement d'authentification */
.auth-warning {
    text-align: center;
    padding: 15px;
    margin-bottom: 20px;
    background-color: #331A47; /* Violet foncé */
    color: #fff;
    border-radius: 8px;
    font-weight: 500;
}

/* Messages de statut (Succès/Erreur) */
.status-message {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  font-weight: bold;
  text-align: center;
}

.status-message.success {
  background-color: #28a745; /* Vert pour succès */
  color: white;
}

.status-message.error {
  background-color: #dc3545; /* Rouge pour erreur */
  color: white;
}
</style>
