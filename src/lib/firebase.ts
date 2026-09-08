import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  initializeFirestore, getFirestore,
  persistentLocalCache, persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | undefined
let _db: Firestore | undefined

// Lazy init — only runs in the browser, never during SSR
export function getDb(): Firestore {
  if (_db) return _db
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  try {
    _db = initializeFirestore(_app, {
      // Kısıtlı/mobil ağlarda WebChannel akışı çalışmayabilir; long-polling'e düş
      experimentalAutoDetectLongPolling: true,
      // Yazmalar cihazda kalıcı kuyruğa alınır, bağlantı gelince eşitlenir (yenilemeye dayanır)
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {
    // Zaten initialize edilmişse (HMR vb.) mevcut örneği al
    _db = getFirestore(_app)
  }
  return _db
}
