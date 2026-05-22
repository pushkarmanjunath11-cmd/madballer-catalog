import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file to Firebase Storage and return its download URL.
 *
 * Intentionally minimal: uploadBytes → getDownloadURL, nothing else.
 * No compression, no retries, no timeouts, no wrappers.
 *
 * If uploads hang, the root cause is Firebase Storage configuration:
 *   1. CORS not set on the bucket  → run the gsutil command in firebase.ts
 *   2. Storage rules block writes  → set allow read, write: if true
 *   3. Wrong storageBucket name    → must match the bucket in Firebase Console
 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const uid  = Math.random().toString(36).slice(2, 10)
  const path = `${folder}/${Date.now()}_${uid}.jpg`

  console.log('[uploadImage] started —', file.name, `${(file.size / 1024).toFixed(0)} KB`)
  console.log('[uploadImage] path:', path)
  console.log('[uploadImage] bucket:', storage.app.options.storageBucket)

  const snap = await uploadBytes(ref(storage, path), file, { contentType: 'image/jpeg' })
  console.log('[uploadImage] upload complete')

  console.log('[uploadImage] getting download URL')
  const url = await getDownloadURL(snap.ref)
  console.log('[uploadImage] URL received:', url)

  return url
}
