// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfmA2tGdlWIYsyHUgqUHoBrhLGVugBf_k",
  authDomain: "pf-web-a6455.firebaseapp.com",
  projectId: "pf-web-a6455",
  storageBucket: "pf-web-a6455.firebasestorage.app",
  messagingSenderId: "799847416316",
  appId: "1:799847416316:web:e8b5de6b3fe564eac3f279",
  measurementId: "G-0QXE4F7H1G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };


