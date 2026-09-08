import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  initializeFirestore, getFirestore,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore'

// Firebase web yapılandırması herkese açıktır (tarayıcıya gönderilir); güvenlik
// Firestore kuralları ile sağlanır. Vercel ortam değişkenlerine görünmez BOM
// karakteri sızdığı için değerler doğrudan burada tutuluyor.
const firebaseConfig = {
  apiKey: 'AIzaSyCvHp8nlOafV6ZQN6HQERrFDjdhbx3KkCs',
  authDomain: 'boya-stok-6da05.firebaseapp.com',
  projectId: 'boya-stok-6da05',
  storageBucket: 'boya-stok-6da05.firebasestorage.app',
  messagingSenderId: '425396193364',
  appId: '1:425396193364:web:7b4d48004697923de945c1',
}

let _app: FirebaseApp | undefined
let _db: Firestore | undefined

// Lazy init — only runs in the browser, never during SSR
export function getDb(): Firestore {
  if (_db) return _db
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  try {
    _db = initializeFirestore(_app, {
      // Bazı ağlar/proxy'ler/eklentiler Firestore'un streaming (WebChannel) kanalını
      // engelliyor; bu durumda SDK sessizce takılır. Long-polling'i zorlamak bunu aşar.
      experimentalForceLongPolling: true,
      // Yazmalar cihazda kalıcı kuyruğa alınır, bağlantı gelince eşitlenir.
      localCache: persistentLocalCache(),
    })
  } catch {
    _db = getFirestore(_app)
  }
  return _db
}
