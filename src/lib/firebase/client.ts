// Firebase istemcisi — uygulama geneli tek örnek (singleton)
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

import { firebaseConfig, firebaseYapilandirildi } from '@/config/firebase-config'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseYapilandirildi) return null
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseYapilandirildi) return null
  if (!auth) auth = getAuth(getFirebaseApp()!)
  return auth
}

export function getFirebaseDb(): Firestore | null {
  if (!firebaseYapilandirildi) return null
  if (!db) {
    // Long-polling: WebChannel akışının katı ağ/proksi arkasında takılmasını önler.
    // Okumalar her ortamda güvenilir döner (başsız tarayıcı, kurumsal ağ vb.).
    db = initializeFirestore(getFirebaseApp()!, { experimentalForceLongPolling: true })
  }
  return db
}

export { firebaseYapilandirildi }
