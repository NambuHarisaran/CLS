import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDKJkcfAtQ798bqC7peutYmXzNR9uV8bP8',
  authDomain: 'kiro-593bc.firebaseapp.com',
  projectId: 'kiro-593bc',
  storageBucket: 'kiro-593bc.firebasestorage.app',
  messagingSenderId: '319526898066',
  appId: '1:319526898066:web:ce25177c67176f1b9b194b',
  measurementId: 'G-R1XGJF6PYQ',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Analytics optional
isSupported().then((yes) => {
  if (yes) getAnalytics(app)
})
