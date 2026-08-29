// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — เชื่อมต่อ Firebase (สัปดาห์ที่ 6: ใช้แค่ Firestore)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtY-G5g1DS2xsrBSr-rTS55-geHpFuAEs",
  authDomain: "plabu-a08a6.firebaseapp.com",
  projectId: "plabu-a08a6",
  storageBucket: "plabu-a08a6.firebasestorage.app",
  messagingSenderId: "781940196681",
  appId: "1:781940196681:web:8af600267f69ab430c0698"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
