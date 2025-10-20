<template>
  <div class="admin-design">
    <h2>🎨 Gestion des Designs/Couleurs </h2>

    <hr class="separator">

    <ion-card class="add-form-card">
      <ion-card-header>
        <ion-card-title>{{ isEditing ? 'Modifier le Design' : 'Ajouter un Nouveau Design' }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <form @submit.prevent="saveDesign">
          
          <ion-item class="input-item">
            <ion-label position="floating">Nom de la Couleur/Design</ion-label>
            <ion-input v-model="newDesign.name" type="text" required></ion-input>
          </ion-item>

          <ion-item class="input-item">
            <ion-label position="floating">Description (Finition)</ion-label>
            <ion-textarea v-model="newDesign.description" rows="3" required></ion-textarea>
          </ion-item>

          <ion-item class="input-item">
            <ion-label position="floating">Supplément Prix (€)</ion-label>
            <ion-input v-model.number="newDesign.price" type="number" required min="0" step="0.01"></ion-input>
          </ion-item>

          <div class="image-upload-section">
            <ion-button expand="block" @click="selectImage" color="light" class="image-button" :disabled="isUploading">
                {{ isUploading ? 'Préparation...' : (newDesign.imageUrl ? 'Changer l\'Image 📸' : 'Sélectionner l\'Image 📷') }}
            </ion-button>
            
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileChange" 
              accept="image/*" 
              style="display: none;"
            />
          </div>

          <div v-if="newDesign.imageUrl" class="image-preview-container">
            <p>Aperçu de la couleur/finition :</p>
            <img :src="newDesign.imageUrl" :alt="newDesign.name" class="image-preview"/>
          </div>

          <ion-button expand="block" type="submit" class="submit-button" :disabled="!newDesign.imageUrl || isUploading">
            {{ isEditing ? 'Sauvegarder les Modifications' : 'Ajouter le Design' }}
          </ion-button>
          
          <ion-button v-if="isEditing" expand="block" color="danger" @click="cancelEdit" class="cancel-button">
            Annuler la Modification
          </ion-button>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>

        </form>
      </ion-card-content>
    </ion-card>

    ---

    <h3 class="list-title">Liste des Designs ({{ designs.length }})</h3>
    <ion-list class="design-list" v-if="designs.length > 0">
      <ion-item v-for="design in designs" :key="design.id" class="list-item-card">
        <ion-thumbnail slot="start">
          <img :src="design.imageUrl" :alt="design.name" />
        </ion-thumbnail>
        <ion-label>
          <h2 class="design-name">{{ design.name }}</h2>
          <p class="design-details">Supplément Prix: **{{ design.price }} €**</p>
          <p class="design-desc">{{ design.description }}</p>
        </ion-label>
        <ion-button slot="end" color="warning" @click="startEdit(design)" class="edit-btn">
          Modifier
        </ion-button>
        <ion-button slot="end" color="danger" @click="deleteDesign(design)" class="delete-btn">
          Supprimer
        </ion-button>
      </ion-item>
    </ion-list>
    <div v-else class="no-designs">
        <p>Aucun design/couleur trouvé dans la base de données.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { isPlatform, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton, alertController, IonList, IonThumbnail } from '@ionic/vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// ✅ Assurez-vous que le chemin est correct pour votre projet
import { db } from '../../firebaseConfig'; 
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';


// --- ÉTATS ---
const fileInput = ref(null);
const designs = ref([]);
const newDesign = ref({
  name: '',
  description: '',
  price: null,
  imageUrl: '', // Contiendra la chaîne Base64 (Data URL)
  imageFile: null, 
});
const isEditing = ref(false);
const editingDesignId = ref(null);
const isUploading = ref(false);
const message = ref('');
const messageType = ref('');


// --- LOGIQUE FIREBASE (Firestore) ---

const fetchDesigns = () => {
  // Collection différente pour les designs
  const designsCol = collection(db, 'designs'); 
  return onSnapshot(designsCol, (snapshot) => {
    designs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, (error) => {
    console.error("Erreur de lecture Firestore:", error);
    setMessage('Erreur de lecture des designs.', 'error');
  });
};

let unsubscribe;
onMounted(() => { unsubscribe = fetchDesigns(); });
onUnmounted(() => { if (unsubscribe) { unsubscribe(); } });


const saveDesign = async () => {
  // 1. Validation
  if (!newDesign.value.name || !newDesign.value.description || newDesign.value.price === null || !newDesign.value.imageUrl) {
    setMessage('Veuillez remplir tous les champs et sélectionner une image !', 'error');
    return;
  }
  
  isUploading.value = true;
  setMessage(isEditing.value ? 'Sauvegarde en cours...' : 'Ajout en cours...', 'info');

  try {
    const finalBase64Url = newDesign.value.imageUrl; 

    // Vérification de la taille (Base64)
    if (finalBase64Url.length > 800000) { 
        throw new Error("Image trop volumineuse. Veuillez sélectionner une image plus petite (max ~600KB).");
    }

    // 2. Préparer les données pour Firestore
    const dataToSave = {
      name: newDesign.value.name,
      description: newDesign.value.description,
      price: newDesign.value.price,
      imageUrl: finalBase64Url, // Enregistrement de la chaîne Base64 (Data URL)
    };
    
    // 3. Ajouter ou Mettre à jour dans Firestore
    if (isEditing.value) {
      const docRef = doc(db, 'designs', editingDesignId.value);
      await updateDoc(docRef, dataToSave);
      setMessage(`Design "${dataToSave.name}" modifié avec succès !`, 'success');
    } else {
      await addDoc(collection(db, 'designs'), dataToSave);
      setMessage(`Design "${dataToSave.name}" ajouté avec succès !`, 'success');
    }

    resetForm();

  } catch (error) {
    console.error("Erreur de sauvegarde:", error);
    setMessage(`Erreur: ${error.message || 'La sauvegarde a échoué'}`, 'error');
  } finally {
    isUploading.value = false;
  }
};

const startEdit = (design) => {
    isEditing.value = true;
    editingDesignId.value = design.id;
    newDesign.value = { 
        name: design.name,
        description: design.description,
        price: design.price,
        imageUrl: design.imageUrl,
        imageFile: null 
    };
    setMessage(`Modification du design "${design.name}".`, 'info');
};

const cancelEdit = () => {
    resetForm();
    setMessage('Modification annulée.', 'info');
};

const deleteDesign = async (design) => {
    const alert = await alertController.create({
        header: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer le design "${design.name}" ?`,
        buttons: [
            { text: 'Annuler', role: 'cancel' },
            {
                text: 'Supprimer',
                handler: async () => {
                    setMessage('Suppression en cours...', 'info');
                    try {
                        const docRef = doc(db, 'designs', design.id);
                        await deleteDoc(docRef);

                        setMessage(`Design "${design.name}" supprimé.`, 'success');
                    } catch (error) {
                        console.error("Erreur de suppression:", error);
                        setMessage('Erreur: La suppression a échoué.', 'error');
                    }
                }
            }
        ]
    });
    await alert.present();
};

// --- LOGIQUE D'UPLOAD D'IMAGE (Base64) ---

const selectImage = async () => {
  if (isPlatform('capacitor')) {
    await selectMobileImage();
  } else {
    fileInput.value.click();
  }
};

const selectMobileImage = async () => {
    const actionSheet = await alertController.create({
        header: 'Sélectionner l\'Image',
        buttons: [
            { text: 'Prendre une Photo 📸', handler: () => captureImage(CameraSource.Camera) },
            { text: 'Choisir dans la Galerie 🖼️', handler: () => captureImage(CameraSource.Photos) },
            { text: 'Annuler', role: 'cancel' }
        ]
    });
    await actionSheet.present();
};

const captureImage = async (source) => {
    try {
        const photo = await Camera.getPhoto({
            quality: 70,
            allowEditing: false,
            resultType: CameraResultType.DataUrl, 
            source: source,
            presentationStyle: 'fullscreen'
        });
        
        newDesign.value.imageUrl = photo.dataUrl;
        newDesign.value.imageFile = photo; 
        setMessage('Image sélectionnée (Base64).', 'info');

    } catch (e) {
        console.log("Sélection d'image annulée ou erreur :", e);
    }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      newDesign.value.imageUrl = e.target.result; 
    };
    reader.readAsDataURL(file);
    
    newDesign.value.imageFile = file;
    setMessage('Image sélectionnée (Base64).', 'info');
  } else {
    if (!isEditing.value) { 
        newDesign.value.imageUrl = '';
        newDesign.value.imageFile = null;
    }
  }
};


// --- UTILITIES ---

const resetForm = () => {
  newDesign.value = { name: '', description: '', price: null, imageUrl: '', imageFile: null };
  isEditing.value = false;
  editingDesignId.value = null;
  if (fileInput.value) { fileInput.value.value = ''; }
  setTimeout(() => { message.value = ''; messageType.value = ''; }, 3000); 
};

const setMessage = (text, type) => {
  message.value = text;
  messageType.value = type;
};
</script>

<style scoped>
/* =======================
   STYLE PRINCIPAL
======================= */
.admin-design { 
    padding: 15px; 
    color: white; 
    background-color: #121212; 
    min-height: 100vh; 
}

/* Titre principal */
h2 { 
    color: #fff; 
    border-bottom: 2px solid #dba8c2ff; 
    padding-bottom: 5px; 
    margin-bottom: 15px; 
}

/* Ligne séparatrice */
.separator { 
    border: none; 
    height: 1px; 
    background: linear-gradient(to right, #8d46a3ff, #333, #ff69b4); 
    margin: 20px 0; 
}

/* =======================
   FORMULAIRE D'AJOUT
======================= */
.add-form-card { 
    background: #201e1eff; 
    color: white; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.5); 
    margin-bottom: 30px; 
    border-radius: 12px; 
    border: 1px solid #333; 
    padding: 0; 
}

/* Titre du formulaire */
.add-form-card ion-card-title { 
    color: #e9d0dcff; 
}

/* Champs de saisie */
.input-item { 
    --background: #2D2D2D; 
    --color: #fff; 
    --padding-start: 10px; 
    margin-bottom: 15px; 
    border-radius: 8px; 
    border: 1px solid #333; 
}
.input-item ion-label { 
    color: #bc69d1ff; 
}
.input-item.item-has-focus { 
    border-color: #933896ff; 
    box-shadow: 0 0 5px rgba(161, 61, 111, 0.5); 
}

/* =======================
   BOUTONS DU FORMULAIRE
======================= */
ion-button.image-button {
    --background: #5a1f5aff !important;
    --color: #ffffff !important;
    border-radius: 8px;
    font-weight: bold;
}
ion-button.submit-button {
    --background: #da9abbff !important; 
    --color: #ffffff !important;
    border-radius: 8px;
    font-weight: bold;
}
ion-button.cancel-button {
    --background: #ff69b4 !important; 
    --color: #ffffff !important;
    border-radius: 8px;
    font-weight: bold;
}
.submit-button:disabled { 
    opacity: 0.5; 
}

/* =======================
   APERÇU IMAGE
======================= */
.image-preview-container { 
    margin-top: 15px; 
    padding: 10px; 
    border: 1px dashed #854a67ff; 
    border-radius: 8px; 
}
.image-preview { 
    max-width: 100%; 
    max-height: 200px; 
    display: block; 
    margin-top: 10px; 
    border-radius: 4px; 
    object-fit: cover; 
}

/* =======================
   MESSAGES
======================= */
.message { 
    padding: 10px; 
    margin-top: 15px; 
    border-radius: 6px; 
    text-align: center; 
    font-weight: bold; 
}
.success { 
    background-color: #0A7E00; 
    color: white; 
} 
.error { 
    background-color: #ff69b4; 
    color: white; 
} 
.info { 
    background-color: #FFD700; 
    color: #121212; 
}

/* =======================
   LISTE DES DESIGNS
======================= */
.list-title { 
    color: #fff; 
    margin-top: 30px; 
    padding-bottom: 5px; 
    border-bottom: 1px solid #ff69b4; 
}
.list-item-card { 
    background: #1F1F1F; 
    color: white; 
    margin-bottom: 10px; 
    border-radius: 8px; 
    padding: 10px 0; 
}
.list-item-card ion-label { padding: 0; }

.design-name { 
    font-size: 1.1em; 
    font-weight: bold; 
    color: #411247ff; 
    margin-bottom: 5px; 
}
.design-details, .design-desc { 
    color: #ccc; 
    font-size: 0.9em; 
}

ion-thumbnail { 
    width: 60px; 
    height: 60px; 
    min-width: 60px; 
    min-height: 60px; 
    border-radius: 4px; 
    overflow: hidden; 
    margin-right: 15px; 
    border: 2px solid #c27ea0ff; 
}

/* =======================
   BOUTONS DANS LA LISTE
======================= */
.list-item-card ion-button.edit-btn {
    --background: #763b91ff !important; 
    --color: #ffffff !important; 
    border-radius: 8px;
    font-weight: bold;
}
.list-item-card ion-button.delete-btn {
    --background: #88168bff !important; 
    --color: #ffffff !important; 
    border-radius: 8px;
    font-weight: bold;
}

/* =======================
   AUCUN DESIGN
======================= */
.no-designs { 
    text-align: center; 
    color: #ccc; 
    padding: 20px; 
    border: 1px dashed #49363fff; 
    border-radius: 8px; 
    margin-top: 20px; 
    background-color: #1F1F1F; 
}

</style>