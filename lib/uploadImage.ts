import imageCompression from 'browser-image-compression'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Compress an image then upload it to Firebase Storage.
 *
 * Uses uploadBytes (one-shot, not resumable) — no listeners, no deadlocks, no state machine.
 * Returns the Firebase download URL.
 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  // Compress
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7,
  })

  // Upload — simple promise, no resumable task, no event listeners
  const uid = Math.random().toString(36).slice(2, 10)
  const path = `${folder}/${Date.now()}_${uid}.jpg`
  const snap = await uploadBytes(ref(storage, path), compressed, {
    contentType: 'image/jpeg',
  })

  return getDownloadURL(snap.ref)
}
