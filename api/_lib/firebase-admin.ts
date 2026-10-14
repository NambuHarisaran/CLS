import * as admin from 'firebase-admin'

let app: admin.app.App

export function getAdminApp(): admin.app.App {
  if (app) return app
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set')
  app = admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
  })
  return app
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}

export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getAdminApp().auth()
  return auth.verifyIdToken(token)
}
