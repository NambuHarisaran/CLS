import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

export function useOnboarding() {
  const { user, userDoc } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (userDoc && userDoc.role === 'customer' && !userDoc.phone) {
      setNeedsOnboarding(true)
    } else {
      setNeedsOnboarding(false)
    }
  }, [userDoc])

  const completeOnboarding = async (name: string, phone: string) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { name, phone })
    setNeedsOnboarding(false)
  }

  return { needsOnboarding, completeOnboarding }
}
