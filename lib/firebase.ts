import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyB_6_Cc3ZqVs07Qwo1lNlczOe3zdWyhryU',
  authDomain: 'madballers-catalog.firebaseapp.com',
  projectId: 'madballers-catalog',
  storageBucket: 'madballers-catalog.appspot.com',
  messagingSenderId: '698375003228',
  appId: '1:698375003228:web:fde9687b851aa9dd169a99',
  measurementId: 'G-993930814P',
}

// ── Firebase Storage CORS ───────────────────────────────────────────────────────
// If uploads fail with storage/retry-limit-exceeded, CORS is not configured.
// Run this ONCE in Google Cloud Shell (console.cloud.google.com):
//
//   echo '[{"origin":["*"],"method":["GET","POST","PUT","DELETE","HEAD"],"maxAgeSeconds":3600}]' \
//     > cors.json && gsutil cors set cors.json gs://madballers-catalog.appspot.com
//
// Storage rules must also allow unauthenticated writes:
//   Firebase Console → Storage → Rules → publish:
//   rules_version = '2';
//   service firebase.storage {
//     match /b/{bucket}/o {
//       match /{allPaths=**} { allow read, write: if true; }
//     }
//   }

// Prevent duplicate initialization in Next.js hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
