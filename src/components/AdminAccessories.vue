<template>
  <div class="admin-accessories">
    <h2>🧰 Gestion des Accessoires </h2>

    <hr class="separator">

    <ion-card class="add-form-card">
      <ion-card-header>
        <ion-card-title> Ajouter un Accessoire </ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <form @submit.prevent="saveAccessory">
          
          <ion-item class="input-item">
            <ion-label position="floating">Nom</ion-label>
            <ion-input v-model="newAccessory.name" type="text" required></ion-input>
          </ion-item>

          <ion-item class="input-item">
            <ion-label position="floating">Description</ion-label>
            <ion-textarea v-model="newAccessory.description" rows="3" required></ion-textarea>
          </ion-item>

          <div class="row-fields">
            <ion-item class="input-item half-width">
                <ion-label position="floating">Prix (€)</ion-label>
                <ion-input v-model.number="newAccessory.price" type="number" required min="0" step="0.01"></ion-input>
            </ion-item>

            <ion-item class="input-item half-width">
              <ion-label position="floating">Stock</ion-label>
              <ion-input v-model.number="newAccessory.stock" type="number" required min="0" step="1"></ion-input>
            </ion-item>
          </div>

          <div class="image-upload-section">
            <ion-button expand="block" @click="selectImage" class="image-button" :disabled="isUploading">
                {{ isUploading ? 'Préparation...' : (newAccessory.imageUrl ? 'Changer l\'Image 📸' : 'Sélectionner l\'Image 📷') }}
            </ion-button>
            
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileChange" 
              accept="image/*" 
              style="display: none;"
            />
          </div>

          <div v-if="newAccessory.imageUrl" class="image-preview-container">
            <p>Aperçu de l'image :</p>
            <img :src="newAccessory.imageUrl" :alt="newAccessory.name" class="image-preview"/>
          </div>

          <ion-button expand="block" type="submit" class="submit-button" :disabled="!newAccessory.imageUrl || isUploading">
            {{ isEditing ? 'Sauvegarder les Modifications' : 'Ajouter l\'Accessoire' }}
          </ion-button>
          
          <ion-button v-if="isEditing" expand="block" @click="cancelEdit" class="cancel-button">
            Annuler la Modification
          </ion-button>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>

        </form>
      </ion-card-content>
    </ion-card>

    <h3 class="list-title">Liste des Accessoires ({{ accessories.length }})</h3>
    <ion-list class="accessory-list" v-if="accessories.length > 0">
      <ion-item v-for="accessory in accessories" :key="accessory.id" class="list-item-card">
        <ion-thumbnail slot="start">
          <img :src="accessory.imageUrl" :alt="accessory.name" />
        </ion-thumbnail>
        <ion-label>
          <h2 class="acc-name">{{ accessory.name }}</h2>
          <p class="acc-details">Prix: **{{ accessory.price }} €** | Stock: **{{ accessory.stock }}**</p>
        </ion-label>
        <ion-button slot="end" @click="startEdit(accessory)" class="edit-btn">
          Modifier
        </ion-button>
        <ion-button slot="end" @click="deleteAccessory(accessory)" class="delete-btn">
          Supprimer
        </ion-button>
      </ion-item>
    </ion-list>
    <div v-else class="no-accessories">
        <p>Aucun accessoire trouvé dans la base de données.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { isPlatform, alertController } from '@ionic/vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db } from '../../firebaseConfig'; 
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const fileInput = ref(null);
const accessories = ref([]);
const newAccessory = ref({ name: '', description: '', price: null, stock: null, imageUrl: '', imageFile: null });
const isEditing = ref(false);
const editingAccessoryId = ref(null);
const isUploading = ref(false);
const message = ref('');
const messageType = ref('');

const fetchAccessories = () => {
  const accessoriesCol = collection(db, 'accessories');
  return onSnapshot(accessoriesCol, (snapshot) => {
    accessories.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, (error) => {
    console.error("Erreur de lecture Firestore:", error);
    setMessage('Erreur de lecture des accessoires.', 'error');
  });
};

let unsubscribe;
onMounted(() => { unsubscribe = fetchAccessories(); });
onUnmounted(() => { if (unsubscribe) { unsubscribe(); } });

const saveAccessory = async () => {
  if (!newAccessory.value.name || !newAccessory.value.description || newAccessory.value.price === null || !newAccessory.value.stock || !newAccessory.value.imageUrl) {
    setMessage('Veuillez remplir tous les champs et sélectionner une image !', 'error');
    return;
  }
  isUploading.value = true;
  setMessage(isEditing.value ? 'Sauvegarde en cours...' : 'Ajout en cours...', 'info');

  try {
    const finalBase64Url = newAccessory.value.imageUrl;
    if (finalBase64Url.length > 800000) throw new Error("Image trop volumineuse.");

    const dataToSave = { 
      name: newAccessory.value.name, 
      description: newAccessory.value.description, 
      price: newAccessory.value.price, 
      stock: newAccessory.value.stock, 
      imageUrl: finalBase64Url 
    };

    if (isEditing.value) {
      await updateDoc(doc(db, 'accessories', editingAccessoryId.value), dataToSave);
      setMessage(`Accessoire "${dataToSave.name}" modifié avec succès !`, 'success');
    } else {
      await addDoc(collection(db, 'accessories'), dataToSave);
      setMessage(`Accessoire "${dataToSave.name}" ajouté avec succès !`, 'success');
    }
    resetForm();
  } catch (error) {
    console.error(error);
    setMessage(`Erreur: ${error.message}`, 'error');
  } finally {
    isUploading.value = false;
  }
};

const startEdit = (accessory) => {
  isEditing.value = true;
  editingAccessoryId.value = accessory.id;
  newAccessory.value = { ...accessory, imageFile: null };
  setMessage(`Modification de l'accessoire "${accessory.name}".`, 'info');
};

const cancelEdit = () => { resetForm(); setMessage('Modification annulée.', 'info'); };

const deleteAccessory = async (accessory) => {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer l'accessoire "${accessory.name}" ?`,
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Supprimer', handler: async () => {
          setMessage('Suppression en cours...', 'info');
          try { await deleteDoc(doc(db, 'accessories', accessory.id)); setMessage(`Accessoire "${accessory.name}" supprimé.`, 'success'); }
          catch(e) { console.error(e); setMessage('Erreur: La suppression a échoué.', 'error'); }
        } 
      }
    ]
  });
  await alert.present();
};

const selectImage = async () => { if (isPlatform('capacitor')) await selectMobileImage(); else fileInput.value.click(); };
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
  try { const photo = await Camera.getPhoto({ quality:70, allowEditing:false, resultType:CameraResultType.DataUrl, source, presentationStyle:'fullscreen' }); newAccessory.value.imageUrl = photo.dataUrl; newAccessory.value.imageFile = photo; setMessage('Image sélectionnée (Base64).', 'info'); }
  catch(e){ console.log("Erreur image :", e); }
};
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if(file){ const reader = new FileReader(); reader.onload = e => newAccessory.value.imageUrl = e.target.result; reader.readAsDataURL(file); newAccessory.value.imageFile = file; setMessage('Image sélectionnée (Base64).','info'); } 
  else if(!isEditing.value){ newAccessory.value.imageUrl=''; newAccessory.value.imageFile=null; }
};

const resetForm = () => { newAccessory.value = { name:'', description:'', price:null, stock:null, imageUrl:'', imageFile:null }; isEditing.value=false; editingAccessoryId.value=null; if(fileInput.value) fileInput.value.value=''; setTimeout(()=>{ message.value=''; messageType.value=''; },3000); };
const setMessage = (text,type) => { message.value=text; messageType.value=type; };
</script>

<style scoped>
/* =======================
   STYLE PRINCIPAL
======================= */
.admin-accessories { 
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
    background: linear-gradient(to right, #ff69b4, #333, #ff69b4); 
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
    color: #ff69b4; 
}
.input-item.item-has-focus { 
    border-color: #ff69b4; 
    box-shadow: 0 0 5px rgba(161, 61, 111, 0.5); 
}

/* Ligne pour prix et stock */
.row-fields { 
    display: flex; 
    gap: 15px; 
}
.half-width { 
    flex: 1; 
}

/* =======================
   BOUTONS DU FORMULAIRE
======================= */

/* Bouton pour sélectionner/changer l'image */
ion-button.image-button {
    --background: #ff69b4 !important; /* rose */
    --color: #ffffff !important;       /* texte blanc */
    border-radius: 8px;
    font-weight: bold;
}

/* Bouton Ajouter / Sauvegarder */
ion-button.submit-button {
    --background: #da9abbff !important; 
    --color: #ffffff !important;
    border-radius: 8px;
    font-weight: bold;
}

/* Bouton Annuler modification */
ion-button.cancel-button {
    --background: #ff69b4 !important; 
    --color: #ffffff !important;
    border-radius: 8px;
    font-weight: bold;
}

/* Bouton submit désactivé */
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
   LISTE DES ACCESSOIRES
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

.acc-name { 
    font-size: 1.1em; 
    font-weight: bold; 
    color: #ff69b4; 
    margin-bottom: 5px; 
}
.acc-details { 
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

/* Bouton Modifier */
.list-item-card ion-button.edit-btn {
    --background: #d41876ff !important; /* rose */
    --color: #ffffff !important;       /* texte blanc */
    border-radius: 8px;
    font-weight: bold;
}

/* Bouton Supprimer */
.list-item-card ion-button.delete-btn {
    --background: #ff69b4 !important; /* rose */
    --color: #ffffff !important;       /* texte blanc */
    border-radius: 8px;
    font-weight: bold;
}

/* =======================
   AUCUN ACCESSOIRE
======================= */
.no-accessories { 
    text-align: center; 
    color: #ccc; 
    padding: 20px; 
    border: 1px dashed #49363fff; 
    border-radius: 8px; 
    margin-top: 20px; 
    background-color: #1F1F1F; 
}

</style>
