import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC33MHWiQjxWWAXgzloDzuYKweVddBaJbI",
  authDomain: "smartsprout-9e402.firebaseapp.com",
  projectId: "smartsprout-9e402",
  storageBucket: "smartsprout-9e402.firebasestorage.app",
  messagingSenderId: "559536307961",
  appId: "1:559536307961:web:7ac4bf42fb335e3f732c28",
  measurementId: "G-E9KZXKBQJC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);