import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDNbSTIVh1uAa54ZMYCCvb3FrVo7XoWm0",
  authDomain: "community-hero-ai-28bc4.firebaseapp.com",
  databaseURL: "https://community-hero-ai-28bc4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "community-hero-ai-28bc4",
  storageBucket: "community-hero-ai-28bc4.firebasestorage.app",
  messagingSenderId: "89495785558",
  appId: "1:89495785558:web:325cbec7e5932887caebf7",
  measurementId: "G-4T3SY4TGDQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
