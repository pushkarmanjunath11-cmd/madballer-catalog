import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB_6_Cc3ZqVs07Qwo1lNlczOe3zdWyhryU',
  authDomain: 'madballers-catalog.firebaseapp.com',
  projectId: 'madballers-catalog',
  messagingSenderId: '698375003228',
  appId: '1:698375003228:web:fde9687b851aa9dd169a99',
  measurementId: 'G-993930814P',
}

// Prevent duplicate initialization in Next.js hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
export default app
