import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import { Role, UserDoc } from '../lib/types'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'nambuharisaran123@gmail.com'

interface AuthContextValue {
  user: User | null
  userDoc: UserDoc | null
  role: Role | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setUserDoc(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)

      try {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          const isAdminEmail =
            firebaseUser.email === ADMIN_EMAIL && firebaseUser.emailVerified
          const role: Role = isAdminEmail ? 'admin' : 'customer'
          const newDoc: Omit<UserDoc, 'uid'> = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            role,
            phone: '',
            createdAt: serverTimestamp() as ReturnType<typeof serverTimestamp> as UserDoc['createdAt'],
          }
          await setDoc(ref, { uid: firebaseUser.uid, ...newDoc })
          setUserDoc({ uid: firebaseUser.uid, ...newDoc } as UserDoc)
        } else {
          setUserDoc(snap.data() as UserDoc)
        }
      } catch (err) {
        console.error('Failed to load or initialize user document:', err)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        role: userDoc?.role ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
