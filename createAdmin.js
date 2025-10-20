import { auth, db } from "./firebaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

async function createAdmin() {
  const email = "zeibisaba114@gmail.com";
  const password = "Admin@123";

  try {
    // 1️⃣ Essayer de se connecter pour vérifier si l'admin existe
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("ℹ️ Admin existant trouvé, suppression…");
      await deleteUser(userCredential.user); // Supprime l’utilisateur existant
      console.log("✅ Ancien admin supprimé !");
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        console.log("ℹ️ Aucun admin existant, création d’un nouveau...");
      } else {
        throw e;
      }
    }

    // 2️⃣ Créer le nouvel utilisateur Admin
    const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = newUserCredential.user;

    // 3️⃣ Ajouter le rôle admin dans Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    console.log("✅ Admin créé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin :", error.code, error.message);
  }
}

// Lancer la création
createAdmin();
