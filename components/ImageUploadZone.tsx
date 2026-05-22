'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { uploadImage, type UploadProgress, UploadError } from '@/lib/uploadImage'
import CropModal from './CropModal'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  /** Called with the Firebase download URL once upload succeeds */
  onUploaded: (url: string) => void
  /** Called immediately after crop with a local data-URL — use for instant preview */
  onPreview?: (src: string) => void
  /** Called when an upload starts or finishes — use to gate form submission */
  onBusyChange?: (busy: boolean) => void
  /** Firebase Storage sub-folder */
  folder?: string
  /** Primary action label */
  label?: string
  /** Smaller secondary hint */
  sublabel?: string
  /** Compact mode for additional image slots */
  compact?: boolean
  /** Locks the zone — no interaction */
  disabled?: boolean
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImageUploadZone({
  onUploaded,
  onPreview,
  onBusyChange,
  folder = 'products',
  label = '+ SELECT IMAGE',
  sublabel = 'drag & drop or tap to browse',
  compact = false,
  disabled = false,
}: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Keep a ref to onBusyChange so the busy-notify effect doesn't need it as a dep
  // (avoids firing onBusyChange on every parent re-render that recreates the callback)
  const onBusyChangeRef = useRef(onBusyChange)
  useEffect(() => { onBusyChangeRef.current = onBusyChange }, [onBusyChange])

  const isUploading = progress !== null && progress.phase !== 'done'
  const isDone = progress?.phase === 'done'

  // Notify parent only when the uploading boolean actually changes
  useEffect(() => {
    onBusyChangeRef.current?.(isUploading)
  }, [isUploading])

  // Clean up any pending crop object-URL on unmount
  useEffect(() => {
    const src = cropSrc
    return () => { if (src) URL.revokeObjectURL(src) }
  }, [cropSrc])

  // ── File validation + crop open ──────────────────────────────────

  const openCrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP)')
      return
    }
    setError(null)
    const url = URL.createObjectURL(file)
    setCropFile(file)
    setCropSrc(url)
  }, [])

  // ── Input / drag handlers ────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) openCrop(file)
    },
    [openCrop],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isUploading) setDragOver(true)
    },
    [disabled, isUploading],
  )

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled || isUploading) return
      const file = e.dataTransfer.files[0]
      if (file) openCrop(file)
    },
    [disabled, isUploading, openCrop],
  )

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return
    if (inputRef.current) inputRef.current.value = '' // allow re-selecting same file
    inputRef.current?.click()
  }, [disabled, isUploading])

  // ── Crop callbacks ───────────────────────────────────────────────

  const handleCropConfirm = useCallback(
    async (croppedFile: File, localPreview: string) => {
      // Close crop modal and revoke object URL
      setCropSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setCropFile(null)

      // ★ Show preview INSTANTLY — before any upload happens
      setPreview(localPreview)
      onPreview?.(localPreview)

      // Start upload in background
      setError(null)
      setProgress({ phase: 'compressing', pct: 0 })

      try {
        const url = await uploadImage(croppedFile, folder, (p) => setProgress(p))
        onUploaded(url)
      } catch (err) {
        const msg = err instanceof UploadError ? err.message : 'Upload failed — tap to retry'
        setError(msg)
        setProgress(null)
      }
    },
    [folder, onUploaded, onPreview],
  )

  const handleCropCancel = useCallback(() => {
    setCropSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
    setCropFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  // ── Dynamic styles ───────────────────────────────────────────────

  const ringCls = dragOver
    ? 'border-white/60 bg-white/5'
    : error
    ? 'border-red-500/45 bg-red-500/[0.04]'
    : isDone
    ? 'border-green-400/45 bg-green-400/[0.04]'
    : isUploading
    ? 'border-white/20 bg-white/[0.03]'
    : 'border-white/15 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04]'

  const minH = compact ? 'min-h-[76px]' : 'min-h-[164px]'

  // ── Render ───────────────────────────────────────────────────────

  return (
    <>
      {/* Crop modal — portal-like, renders above everything */}
      {cropSrc && cropFile && (
        <CropModal
          src={cropSrc}
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label={label}
        className={`
          relative rounded-xl border-2 border-dashed overflow-hidden select-none
          transition-all duration-200
          ${minH} ${ringCls}
          ${!disabled && !isUploading ? 'cursor-pointer' : 'cursor-default'}
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
          disabled={disabled || isUploading}
          onChange={handleInputChange}
        />

        {/* ── Background preview (appears instantly after crop) ── */}
        <AnimatePresence>
          {preview && (
            <motion.div
              key="bg"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none"
            >
              <Image src={preview} alt="" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/55" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Foreground status overlay ── */}
        <div className={`relative z-10 flex flex-col items-center justify-center gap-2 p-3 ${minH}`}>
          <AnimatePresence mode="wait">

            {/* UPLOADING / COMPRESSING */}
            {isUploading && progress ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-2 px-1"
              >
                {/* Progress track */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      progress.phase === 'compressing' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress.pct}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
                {/* Phase label */}
                <p
                  className="text-center text-[10px] tracking-widest text-chrome-400"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {progress.phase === 'compressing'
                    ? `⚙ COMPRESSING — ${progress.pct}%`
                    : `↑ UPLOADING — ${progress.pct}%`}
                </p>
              </motion.div>

            /* DONE */
            ) : isDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
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
            ) : error ? (
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
