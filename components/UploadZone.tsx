'use client'

import { memo, useRef, useCallback, useEffect, useReducer } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { startUpload, UploadError, type UploadProgress } from '@/lib/firebaseUpload'
import CropModal from './CropModal'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  /** Called with Firebase download URL after successful upload */
  onUploaded: (url: string) => void
  /** Called immediately after crop with a local blob URL — use for instant preview elsewhere */
  onPreview?: (blobUrl: string) => void
  /** Called when busy state changes — gate form submission with this */
  onBusyChange?: (busy: boolean) => void
  /** Called with a human-readable error message (also shown in the zone) */
  onError?: (msg: string) => void
  /** Firebase Storage sub-folder */
  folder?: string
  /** Primary label in idle state */
  label?: string
  /** Secondary hint in idle state */
  sublabel?: string
  /** Compact slot mode (smaller height, no icon/sublabel) */
  compact?: boolean
  /** Prevent all interaction */
  disabled?: boolean
}

type Status = 'idle' | 'compressing' | 'uploading' | 'done' | 'error'

interface State {
  status: Status
  pct: number
  error: string | null
  // Crop modal
  cropSrc: string | null
  cropFile: File | null
}

type Action =
  | { type: 'CROP_OPEN'; src: string; file: File }
  | { type: 'CROP_CANCEL' }
  | { type: 'PROGRESS'; phase: 'compressing' | 'uploading'; pct: number }
  | { type: 'DONE' }
  | { type: 'ERROR'; msg: string }
  | { type: 'RESET' }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'CROP_OPEN':
      return { ...s, cropSrc: a.src, cropFile: a.file }
    case 'CROP_CANCEL':
      return { ...s, cropSrc: null, cropFile: null }
    case 'PROGRESS':
      return { ...s, status: a.phase, pct: a.pct, error: null, cropSrc: null, cropFile: null }
    case 'DONE':
      return { ...s, status: 'done', pct: 100, error: null }
    case 'ERROR':
      return { ...s, status: 'error', pct: 0, error: a.msg }
    case 'RESET':
      return { status: 'idle', pct: 0, error: null, cropSrc: null, cropFile: null }
    default:
      return s
  }
}

const INIT: State = { status: 'idle', pct: 0, error: null, cropSrc: null, cropFile: null }

// ── Component (memoized) ───────────────────────────────────────────────────────

function UploadZoneInner({
  onUploaded,
  onPreview,
  onBusyChange,
  onError,
  folder = 'products',
  label = '+ SELECT IMAGE',
  sublabel = 'drag & drop or tap to browse',
  compact = false,
  disabled = false,
}: Props) {
  const [state, dispatch] = useReducer(reducer, INIT)
  const { status, pct, error, cropSrc, cropFile } = state

  // Stable refs — no re-renders when these change
  const inputRef      = useRef<HTMLInputElement>(null)
  const imgRef        = useRef<HTMLImageElement>(null)
  const overlayRef    = useRef<HTMLDivElement>(null)
  const previewUrlRef = useRef<string | null>(null)  // blob URL, not base64
  const cancelRef     = useRef<(() => void) | null>(null)
  const onPreviewRef  = useRef(onPreview)
  const onBusyRef     = useRef(onBusyChange)
  const onErrorRef    = useRef(onError)
  const dragOverRef   = useRef(false)
  const zoneRef       = useRef<HTMLDivElement>(null)

  // Keep refs in sync without triggering re-renders
  useEffect(() => { onPreviewRef.current = onPreview }, [onPreview])
  useEffect(() => { onBusyRef.current = onBusyChange }, [onBusyChange])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  const isBusy = status === 'compressing' || status === 'uploading'

  // Notify parent when busy state changes
  useEffect(() => {
    onBusyRef.current?.(isBusy)
  }, [isBusy])

  // Revoke preview blob URL on unmount, cancel any pending upload
  useEffect(() => {
    return () => {
      cancelRef.current?.()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // Also revoke crop src on unmount
  useEffect(() => {
    const src = cropSrc
    return () => { if (src) URL.revokeObjectURL(src) }
  }, [cropSrc])

  // ── DOM ref preview (zero re-renders) ──────────────────────────────
  function applyPreview(blobUrl: string) {
    // Revoke previous blob URL
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = blobUrl

    if (imgRef.current) {
      imgRef.current.src = blobUrl
      imgRef.current.style.opacity = '1'
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '1'
    }

    // Notify parent (e.g. live preview panel) — stable via ref, no re-render risk
    onPreviewRef.current?.(blobUrl)
  }

  // ── Drag-over border via DOM mutation (no re-renders) ──────────────
  function setDragStyle(over: boolean) {
    dragOverRef.current = over
    if (zoneRef.current) {
      if (over) {
        zoneRef.current.classList.add('drag-over')
      } else {
        zoneRef.current.classList.remove('drag-over')
      }
    }
  }

  // ── File validation → crop open ────────────────────────────────────
  const openCrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      dispatch({ type: 'ERROR', msg: 'Please select an image file (JPG, PNG, WEBP)' })
      return
    }
    const src = URL.createObjectURL(file)
    dispatch({ type: 'CROP_OPEN', src, file })
  }, [])

  // ── Input / drag handlers ───────────────────────────────────────────
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) openCrop(file)
  }, [openCrop])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isBusy) setDragStyle(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isBusy])

  const handleDragLeave = useCallback(() => setDragStyle(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragStyle(false)
    if (disabled || isBusy) return
    const file = e.dataTransfer.files[0]
    if (file) openCrop(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isBusy, openCrop])

  const handleClick = useCallback(() => {
    if (disabled || isBusy) return
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isBusy])

  // ── Crop callbacks ──────────────────────────────────────────────────
  const handleCropConfirm = useCallback(
    (croppedFile: File, _base64: string) => {
      // Discard base64 — create a lightweight blob URL instead
      const blobUrl = URL.createObjectURL(croppedFile)
      applyPreview(blobUrl)

      dispatch({ type: 'PROGRESS', phase: 'compressing', pct: 0 })

      const handle = startUpload(croppedFile, folder, (p: UploadProgress) => {
        if (p.phase === 'done') {
          // handled in promise .then
        } else {
          dispatch({ type: 'PROGRESS', phase: p.phase, pct: p.pct })
        }
      })

      cancelRef.current = handle.cancel

      handle.promise
        .then((url) => {
          cancelRef.current = null
          dispatch({ type: 'DONE' })
          onUploaded(url)
        })
        .catch((err: unknown) => {
          cancelRef.current = null
          const msg =
            err instanceof UploadError ? err.message : 'Upload failed — tap to retry'
          dispatch({ type: 'ERROR', msg })
          onErrorRef.current?.(msg)
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folder, onUploaded],
  )

  const handleCropCancel = useCallback(() => {
    dispatch({ type: 'CROP_CANCEL' })
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    cancelRef.current?.()
    cancelRef.current = null
    dispatch({ type: 'ERROR', msg: 'Upload cancelled' })
  }, [])

  // ── Styles ──────────────────────────────────────────────────────────
  const minH = compact ? 'min-h-[76px]' : 'min-h-[164px]'

  const borderCls =
    status === 'error'
      ? 'border-red-500/45 bg-red-500/[0.04]'
      : status === 'done'
      ? 'border-green-400/45 bg-green-400/[0.04]'
      : isBusy
      ? 'border-white/20 bg-white/[0.03]'
      : 'border-white/15 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04] drag-over:border-white/60 drag-over:bg-white/5'

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Crop modal */}
      {cropSrc && cropFile && (
        <CropModal
          src={cropSrc}
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div
        ref={zoneRef}
        role="button"
        tabIndex={disabled || isBusy ? -1 : 0}
        aria-label={label}
        className={`
          relative rounded-xl border-2 border-dashed overflow-hidden select-none
          transition-colors duration-200
          ${minH} ${borderCls}
          ${!disabled && !isBusy ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={handleClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          disabled={disabled || isBusy}
          onChange={handleInputChange}
        />

        {/* ── Background preview image (DOM-mutated, zero re-renders) ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src=""
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
          />
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/55"
            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
          />
        </div>

        {/* ── Foreground status ── */}
        <div className={`relative z-10 flex flex-col items-center justify-center gap-2 p-3 ${minH}`}>
          <AnimatePresence mode="wait">

            {/* COMPRESSING / UPLOADING */}
            {isBusy ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-2 px-1"
              >
                {/* Progress bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      status === 'compressing' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
                {/* Phase label */}
                <p
                  className="text-center text-[10px] tracking-widest text-chrome-400"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {status === 'compressing'
                    ? `⚙ COMPRESSING — ${pct}%`
                    : `↑ UPLOADING — ${pct}%`}
                </p>
                {/* Cancel button */}
                {status === 'uploading' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="block mx-auto text-[9px] tracking-widest text-chrome-600 hover:text-red-400 transition-colors"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    ✕ CANCEL
                  </button>
                )}
              </motion.div>

            /* DONE */
            ) : status === 'done' ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-center gap-2"
              >
                <span
                  className="text-green-400 text-[10px] tracking-widest font-medium"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  ✓ UPLOADED
                </span>
                {!compact && (
                  <span
                    className="text-chrome-600 text-[9px] tracking-widest"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    (tap to change)
                  </span>
                )}
              </motion.div>

            /* ERROR */
            ) : status === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-1.5 px-2"
              >
                <p
                  className="text-red-400 text-[10px] tracking-widest leading-relaxed"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  ✕ {error}
                </p>
                <p
                  className="text-chrome-600 text-[9px] tracking-widest"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  TAP TO RETRY
                </p>
              </motion.div>

            /* IDLE */
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-1"
              >
                {!compact && (
                  <svg
                    className="w-6 h-6 text-chrome-600 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                )}
                <p
                  className="text-chrome-400 text-xs tracking-widest"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {label}
                </p>
                {!compact && (
                  <p
                    className="text-chrome-700 text-[9px] tracking-widest"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    {sublabel}
                  </p>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

const UploadZone = memo(UploadZoneInner)
export default UploadZone
