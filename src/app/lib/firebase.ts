import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyDpj7787Ypdqy1YQlhmDg7HuDovDp5vt5o',
  authDomain: 'todolist-b135e.firebaseapp.com',
  projectId: 'todolist-b135e',
  storageBucket: 'todolist-b135e.firebasestorage.app',
  messagingSenderId: '373264301024',
  appId: '1:373264301024:web:da88900976ff00deebc985',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

