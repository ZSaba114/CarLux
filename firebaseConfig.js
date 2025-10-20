import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCpUFcnaeHhE98i3QqwTQXlt-fsEoGDo_Q",
  authDomain: "carlux-3d.firebaseapp.com",
  projectId: "carlux-3d",
  storageBucket: "carlux-3d.appspot.com",
  messagingSenderId: "438962725831",
  appId: "1:438962725831:web:0434044575881dfddc6fe2",
  measurementId: "G-SG18LZPPMX",
};

const app = initializeApp(firebaseConfig);

isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
