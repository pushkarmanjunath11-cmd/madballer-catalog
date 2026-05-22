import imageCompression from 'browser-image-compression'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type UploadPhase = 'compressing' | 'uploading' | 'done'

export interface UploadProgress {
  phase: UploadPhase
  pct: number // 0–100
}

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'unknown',
  ) {
    super(message)
    this.name = 'UploadError'
  }
}

// ── Config ─────────────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,          // 300 KB hard cap
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.7,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function friendlyStorageError(code: string): string {
  if (code.includes('unauthorized') || code.includes('permission'))
    return 'Permission denied — update Firebase Storage rules to allow writes'
  if (code.includes('canceled'))
    return 'Upload was cancelled'
  if (code.includes('retry-limit'))
    return 'Network error — check your connection and Firebase Storage CORS settings'
  if (code.includes('quota'))
    return 'Storage quota exceeded — free up space in Firebase'
  if (code.includes('invalid-checksum'))
    return 'File corrupted during transfer — please try again'
  return `Upload failed (${code})`
}

function uniquePath(folder: string): string {
  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return `${folder}/${Date.now()}_${uid}.jpg`
}

// ── Core upload function ───────────────────────────────────────────────────────

/**
 * Compress + upload an image to Firebase Storage.
 *
 * Progress is two-phase:
 *   compressing  0 → 50 %   web-worker compression via browser-image-compression
 *   uploading   50 → 100 %  byte-level Firebase Storage progress
 *
 * @returns Firebase Storage download URL
 * @throws  UploadError with a human-readable message and error code
 */
export async function uploadImage(
  file: File,
  folder = 'products',
  onProgress?: (p: UploadProgress) => void,
): Promise<string> {
  // Validate type
  if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
    throw new UploadError(
      'Invalid file — please use JPG, PNG, WEBP, or HEIC',
      'invalid-type',
    )
  }

  // ── Phase 1: compress ──────────────────────────────────── 0 → 50 %
  onProgress?.({ phase: 'compressing', pct: 0 })

  let compressed: File
  try {
    compressed = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      onProgress: (p) =>
        onProgress?.({ phase: 'compressing', pct: Math.round(p * 0.5) }),
    })
  } catch (err) {
    throw new UploadError(
      `Compression failed: ${err instanceof Error ? err.message : String(err)}`,
      'compression-failed',
    )
  }

  // ── Phase 2: upload ──────────────────────────────────── 50 → 100 %
  const storageRef = ref(storage, uniquePath(folder))

  return new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, compressed, {
      contentType: 'image/jpeg',
    })

    task.on(
      'state_changed',
      (snap) =>
        onProgress?.({
          phase: 'uploading',
          pct: 50 + Math.round((snap.bytesTransferred / snap.totalBytes) * 50),
        }),
      (err) =>
        reject(
          new UploadError(
            friendlyStorageError((err as { code?: string }).code ?? ''),
            (err as { code?: string }).code ?? 'unknown',
          ),
        ),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          onProgress?.({ phase: 'done', pct: 100 })
          resolve(url)
        } catch {
          reject(new UploadError('Failed to retrieve download URL', 'get-url-failed'))
        }
      },
    )
  })
}
