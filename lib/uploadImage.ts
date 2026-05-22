import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

// ── Compression ────────────────────────────────────────────────────────────────

/**
 * Resize + JPEG-compress a file via canvas.
 *
 * Wrapped in Promise.race against an 8-second timeout.
 * If compression fails for ANY reason (unsupported format, canvas quirk,
 * toBlob never fires, timeout) the original file is returned as a fallback
 * so the upload can still proceed.
 */
async function compress(file: File, maxPx = 1200, quality = 0.80): Promise<Blob> {
  const compressionWork = new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let w = img.naturalWidth
      let h = img.naturalHeight

      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h / w * maxPx); w = maxPx }
        else        { w = Math.round(w / h * maxPx); h = maxPx }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.drawImage(img, 0, 0, w, h)

      // toBlob can silently never call back on unsupported formats —
      // that is caught by the race timeout below
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image failed to load into canvas'))
    }

    img.src = objectUrl
  })

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Compression timed out after 8s')), 8_000),
  )

  try {
    return await Promise.race([compressionWork, timeout])
  } catch (e) {
    // Compression failed for any reason — fall back to the raw file so the
    // upload can still proceed instead of hanging forever
    console.warn('[uploadImage] Compression failed, falling back to raw file:', e)
    return file
  }
}

// ── Upload ─────────────────────────────────────────────────────────────────────

/**
 * Compress then upload a file to Firebase Storage.
 *
 * The entire operation is raced against a 30-second timeout so it can never
 * hang silently. Throws a descriptive Error on failure so the caller always
 * gets a settled promise.
 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  console.log('[uploadImage] started —', file.name, `(${(file.size / 1024).toFixed(0)} KB)`)

  const doUpload = async (): Promise<string> => {
    // Step 1 — compress
    const blob = await compress(file)
    console.log('[uploadImage] compressed —', `${(blob.size / 1024).toFixed(0)} KB`)

    // Step 2 — upload bytes
    const uid  = Math.random().toString(36).slice(2, 10)
    const path = `${folder}/${Date.now()}_${uid}.jpg`
    console.log('[uploadImage] uploading to path:', path)

    let snap
    try {
      snap = await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' })
    } catch (e) {
      console.error('[uploadImage] uploadBytes failed:', e)
      throw new Error(
        'Firebase upload failed — check Storage rules and CORS settings'
      )
    }
    console.log('[uploadImage] uploadBytes complete')

    // Step 3 — get download URL
    console.log('[uploadImage] fetching download URL')
    let url: string
    try {
      url = await getDownloadURL(snap.ref)
    } catch (e) {
      console.error('[uploadImage] getDownloadURL failed:', e)
      throw new Error('Upload succeeded but failed to retrieve the download URL')
    }
    console.log('[uploadImage] URL received:', url)
    return url
  }

  // Race the whole pipeline against a 30-second hard timeout
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('Upload timed out after 30s — check Firebase CORS settings')),
      30_000,
    )
  })

  try {
    const url = await Promise.race([doUpload(), timeout])
    clearTimeout(timeoutId!)
    console.log('[uploadImage] done ✓')
    return url
  } catch (e) {
    clearTimeout(timeoutId!)
    console.error('[uploadImage] failed ✗', e)
    throw e
  }
}
