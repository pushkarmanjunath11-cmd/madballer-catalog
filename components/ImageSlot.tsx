'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadImage } from '@/lib/uploadImage'
import CropModal from './CropModal'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  /** Called with the Firebase download URL once upload succeeds */
  onUrl: (url: string) => void
  /** Called immediately after crop with a local data-URL — for live preview */
  onPreview?: (dataUrl: string) => void
  /** Called when upload starts or finishes — use to gate form submission */
  onBusyChange?: (busy: boolean) => void
  /** Firebase Storage sub-folder */
  folder?: string
  /** Primary label shown in idle state */
  label?: string
  /** Secondary hint shown in idle state */
  sublabel?: string
  /** Compact mode for additional image slots */
  compact?: boolean
}

type Status = 'idle' | 'uploading' | 'done' | 'error'

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImageSlot({
  onUrl,
  onPreview,
  onBusyChange,
  folder = 'products',
  label = '+ SELECT IMAGE',
  sublabel = 'drag & drop or tap to browse',
  compact = false,
}: Props) {
  const [status,   setStatus]   = useState<Status>('idle')
  const [preview,  setPreview]  = useState('')   // data-URL for background preview
  const [error,    setError]    = useState('')
  const [cropSrc,  setCropSrc]  = useState('')   // object URL fed to CropModal
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Helpers ────────────────────────────────────────────────────────

  const busy = (on: boolean) => onBusyChange?.(on)

  const openCrop = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP)')
      setStatus('error')
      return
    }
    setCropSrc(URL.createObjectURL(file))
    setCropFile(file)
  }

  // ── Input / drag handlers ──────────────────────────────────────────

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) openCrop(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (status === 'uploading') return
    const file = e.dataTransfer.files[0]
    if (file) openCrop(file)
  }, [status])

  const handleClick = () => {
    if (status === 'uploading') return
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  }

  // ── Crop callbacks ─────────────────────────────────────────────────

  const handleCropConfirm = useCallback(async (croppedFile: File, dataUrl: string) => {
    // Close crop modal and release object URL
    setCropSrc(prev => { URL.revokeObjectURL(prev); return '' })
    setCropFile(null)

    // Show preview instantly — before any network request
    setPreview(dataUrl)
    onPreview?.(dataUrl)

    // Upload
    setStatus('uploading')
    setError('')
    busy(true)

    try {
      const url = await uploadImage(croppedFile, folder)
      onUrl(url)
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed — tap to retry'
      setError(msg)
      setStatus('error')
    } finally {
      busy(false)
    }
  }, [folder, onUrl, onPreview])

  const handleCropCancel = useCallback(() => {
    setCropSrc(prev => { URL.revokeObjectURL(prev); return '' })
    setCropFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  // ── Styles ─────────────────────────────────────────────────────────

  const minH = compact ? 'min-h-[76px]' : 'min-h-[164px]'

  const ringCls = dragOver
    ? 'border-white/60 bg-white/5'
    : status === 'error'
    ? 'border-red-500/45 bg-red-500/[0.04]'
    : status === 'done'
    ? 'border-green-400/45 bg-green-400/[0.04]'
    : status === 'uploading'
    ? 'border-white/20 bg-white/[0.03]'
    : 'border-white/15 bg-white/[0.02] hover:border-white/35 hover:bg-white/[0.04]'

  // ── Render ─────────────────────────────────────────────────────────

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
        role="button"
        tabIndex={status === 'uploading' ? -1 : 0}
        aria-label={label}
        className={`
          relative rounded-xl border-2 border-dashed overflow-hidden select-none
          transition-colors duration-200
          ${minH} ${ringCls}
          ${status === 'uploading' ? 'cursor-wait' : 'cursor-pointer'}
        `}
        onClick={handleClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        onDragOver={(e) => { e.preventDefault(); if (status !== 'uploading') setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          disabled={status === 'uploading'}
          onChange={handleChange}
        />

        {/* Background preview (shown after crop) */}
        {preview && (
          <div className="absolute inset-0 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        )}

        {/* Status overlay */}
        <div className={`relative z-10 flex flex-col items-center justify-center gap-2 p-3 ${minH}`}>
          <AnimatePresence mode="wait">

            {/* UPLOADING */}
            {status === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center gap-2.5"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p
                  className="text-chrome-400 text-[10px] tracking-widest"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  UPLOADING...
                </p>
              </motion.div>
            )}

            {/* DONE */}
            {status === 'done' && (
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
            )}

            {/* ERROR */}
            {status === 'error' && (
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
            )}

            {/* IDLE */}
            {status === 'idle' && (
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
