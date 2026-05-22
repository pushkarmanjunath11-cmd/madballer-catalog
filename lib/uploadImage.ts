import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file to Firebase Storage and return its download URL.
 *
 * No compression library — CropModal already resizes to ≤1200 px at JPEG 0.80
 * before this function is called, so the file is already appropriately sized.
 *
 * Uses uploadBytes (single-shot, no resumable task, no listeners, no deadlocks).
 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const uid = Math.random().toString(36).slice(2, 10)
  const path = `${folder}/${Date.now()}_${uid}.jpg`
  const snap = await uploadBytes(ref(storage, path), file, { contentType: 'image/jpeg' })
  return getDownloadURL(snap.ref)
}
