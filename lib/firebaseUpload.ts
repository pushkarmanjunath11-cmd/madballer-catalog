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

export interface UploadHandle {
  /** Resolves with Firebase download URL, rejects with UploadError */
  promise: Promise<string>
  /** Cancels the upload (no-op if already done) */
  cancel(): void
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
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1200,
  useWebWorker: false,       // more reliable in Next.js / SSR environments
  fileType: 'image/jpeg' as const,
  initialQuality: 0.6,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function friendlyStorageError(code: string): string {
  if (code.includes('unauthorized') || code.includes('permission'))
    return 'Permission denied — check Firebase Storage rules'
  if (code.includes('canceled'))
    return 'Upload cancelled'
  if (code.includes('retry-limit'))
    return 'Network error — check Firebase CORS settings'
  if (code.includes('quota'))
    return 'Storage quota exceeded'
  if (code.includes('invalid-checksum'))
    return 'File corrupted during transfer — please retry'
  return `Upload failed (${code})`
}

function uniquePath(folder: string): string {
  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return `${folder}/${Date.now()}_${uid}.jpg`
}

// ── Core ───────────────────────────────────────────────────────────────────────

/**
 * Start a compress → upload pipeline.
 *
 * Progress is two-phase:
 *   compressing  0 → 50 %   (browser-image-compression, no web worker)
 *   uploading   50 → 100 %  (Firebase Storage byte progress)
 *
 * Progress callbacks are throttled — only fired when pct changes by ≥ 2 points.
 *
 * Returns an UploadHandle so the caller can cancel the upload at any time.
 */
export function startUpload(
  file: File,
  folder = 'products',
  onProgress: (p: UploadProgress) => void,
): UploadHandle {
  // Validate type synchronously before creating any promise
  if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
    const err = new UploadError(
      'Invalid file — use JPG, PNG, WEBP, or HEIC',
      'invalid-type',
    )
    return {
      promise: Promise.reject(err),
      cancel: () => {},
    }
  }

  let taskCancel: (() => void) | null = null
  let cancelled = false

  // Throttle helper — only emit when pct jumps ≥ 2 points
  let lastPct = -1
  function emit(p: UploadProgress) {
    if (p.phase === 'done' || p.pct - lastPct >= 2) {
      lastPct = p.pct
      onProgress(p)
    }
  }

  const promise = (async (): Promise<string> => {
    // ── Phase 1: compress ────────────────────────────────── 0 → 50 %
    emit({ phase: 'compressing', pct: 0 })

    let compressed: File
    try {
      compressed = await imageCompression(file, {
        ...COMPRESSION_OPTIONS,
        onProgress: (p) => {
          if (!cancelled) emit({ phase: 'compressing', pct: Math.round(p * 0.5) })
        },
      })
    } catch (err) {
      if (cancelled) throw new UploadError('Upload cancelled', 'canceled')
      throw new UploadError(
        `Compression failed: ${err instanceof Error ? err.message : String(err)}`,
        'compression-failed',
      )
    }

    if (cancelled) throw new UploadError('Upload cancelled', 'canceled')

    // ── Phase 2: upload ──────────────────────────────────── 50 → 100 %
    const storageRef = ref(storage, uniquePath(folder))

    return new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, compressed, {
        contentType: 'image/jpeg',
      })

      // Expose cancel
      taskCancel = () => task.cancel()

      task.on(
        'state_changed',
        (snap) => {
          if (!cancelled)
            emit({
              phase: 'uploading',
              pct: 50 + Math.round((snap.bytesTransferred / snap.totalBytes) * 50),
            })
        },
        (err) => {
          const code = (err as { code?: string }).code ?? 'unknown'
          reject(new UploadError(friendlyStorageError(code), code))
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref)
            emit({ phase: 'done', pct: 100 })
            resolve(url)
          } catch {
            reject(new UploadError('Failed to retrieve download URL', 'get-url-failed'))
          }
        },
      )
    })
  })()

  return {
    promise,
    cancel() {
      cancelled = true
      taskCancel?.()
    },
  }
}
