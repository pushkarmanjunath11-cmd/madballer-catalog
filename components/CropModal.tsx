'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Box { x: number; y: number; w: number; h: number }
type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se'

interface Props {
  /** Blob URL of the selected image — shown in the cropper */
  src: string
  /** Called with the cropped JPEG blob once the user confirms */
  onCrop: (blob: Blob) => void
  /** Called when the user cancels */
  onCancel: () => void
}

// ── Constants & helpers ────────────────────────────────────────────────────────

const MIN_PX  = 48   // minimum crop-box side length (display px)
const HANDLE  = 13   // corner handle size (px)

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Square-locked drag: all corners scale w === h uniformly.
 * Delta is the average of the two axis movements for the corner direction.
 */
function applyDrag(handle: Handle, dx: number, dy: number, b: Box, iw: number, ih: number): Box {
  // Moving the whole box — no ratio constraint
  if (handle === 'move') {
    return { ...b, x: clamp(b.x + dx, 0, iw - b.w), y: clamp(b.y + dy, 0, ih - b.h) }
  }

  switch (handle) {
    case 'se': {
      const size = clamp(b.w + (dx + dy) / 2, MIN_PX, Math.min(iw - b.x, ih - b.y))
      return { x: b.x, y: b.y, w: size, h: size }
    }
    case 'ne': {
      const size = clamp(b.w + (dx - dy) / 2, MIN_PX, Math.min(iw - b.x, b.y + b.h))
      return { x: b.x, y: b.y + b.h - size, w: size, h: size }
    }
    case 'sw': {
      const size = clamp(b.w + (-dx + dy) / 2, MIN_PX, Math.min(b.x + b.w, ih - b.y))
      return { x: b.x + b.w - size, y: b.y, w: size, h: size }
    }
    case 'nw': {
      const size = clamp(b.w + (-dx - dy) / 2, MIN_PX, Math.min(b.x + b.w, b.y + b.h))
      return { x: b.x + b.w - size, y: b.y + b.h - size, w: size, h: size }
    }
  }
}

function handleStyle(lx: number, ty: number, cursor: string): React.CSSProperties {
  return {
    position:    'absolute',
    left:        lx - HANDLE / 2,
    top:         ty - HANDLE / 2,
    width:       HANDLE,
    height:      HANDLE,
    background:  'white',
    borderRadius: 2,
    cursor,
    zIndex:      20,
    touchAction: 'none',
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CropModal({ src, onCrop, onCancel }: Props) {
  // Display dimensions of the image (computed after load)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  // Crop box in display-pixel coordinates
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 })

  // Natural image dimensions — stored in a ref so canvas drawing doesn't need state
  const naturalSize = useRef<{ w: number; h: number } | null>(null)

  // Drag state lives in a ref — zero re-renders during drag, no timing races
  const drag = useRef<{
    handle: Handle
    startX: number
    startY: number
    box0:   Box
  } | null>(null)

  // ── Load image, compute display size, init crop box ────────────────

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      naturalSize.current = { w: img.naturalWidth, h: img.naturalHeight }

      const maxW  = Math.min(window.innerWidth  - 80, 720)
      const maxH  = Math.min(window.innerHeight - 220, 540)
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const w     = Math.round(img.naturalWidth  * scale)
      const h     = Math.round(img.naturalHeight * scale)

      setImgSize({ w, h })

      // Init as a centred square (76% of the shorter side) so the ratio is locked from the start
      const size = Math.round(Math.min(w, h) * 0.76)
      setBox({ x: Math.round((w - size) / 2), y: Math.round((h - size) / 2), w: size, h: size })
    }
    img.src = src
  }, [src])

  // ── Document-level pointer listeners (handles fast drags outside the element) ─

  useEffect(() => {
    if (!imgSize) return

    const onMove = (e: PointerEvent) => {
      if (!drag.current) return
      // Destructure SYNCHRONOUSLY — prevents timing race where drag.current
      // could be nulled between this guard and field access below
      const { handle, startX, startY, box0 } = drag.current
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      setBox(applyDrag(handle, dx, dy, box0, imgSize.w, imgSize.h))
    }
    const onUp = () => { drag.current = null }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup',   onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup',   onUp)
    }
  }, [imgSize])

  // ── ESC to cancel ──────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // ── Drag start ─────────────────────────────────────────────────────

  const startDrag = useCallback((e: React.PointerEvent, handle: Handle) => {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { handle, startX: e.clientX, startY: e.clientY, box0: box }
  }, [box])

  // ── Crop & export ──────────────────────────────────────────────────

  const handleCrop = useCallback(() => {
    const nat = naturalSize.current
    if (!nat || !imgSize) return

    const scaleX = nat.w / imgSize.w
    const scaleY = nat.h / imgSize.h

    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(box.w * scaleX)
    canvas.height = Math.round(box.h * scaleY)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Load a fresh Image instance for pixel-accurate drawing
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(
        img,
        Math.round(box.x * scaleX), Math.round(box.y * scaleY),
        Math.round(box.w * scaleX), Math.round(box.h * scaleY),
        0, 0, canvas.width, canvas.height,
      )
      canvas.toBlob((blob) => { if (blob) onCrop(blob) }, 'image/jpeg', 0.92)
    }
    img.src = src
  }, [box, imgSize, onCrop, src])

  // ── Render ─────────────────────────────────────────────────────────

  const corners: Array<[Handle, number, number, string]> = imgSize ? [
    ['nw', box.x,          box.y,          'nw-resize'],
    ['ne', box.x + box.w,  box.y,          'ne-resize'],
    ['sw', box.x,          box.y + box.h,  'sw-resize'],
    ['se', box.x + box.w,  box.y + box.h,  'se-resize'],
  ] : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.93)' }}
    >
      {/* Instruction */}
      <p
        className="mb-5 text-chrome-400 text-[10px] tracking-[0.22em] select-none"
        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        DRAG TO CROP — SQUARE
      </p>

      {/* Loading spinner */}
      {!imgSize && (
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      )}

      {/* Crop UI */}
      {imgSize && (
        <div
          style={{ position: 'relative', width: imgSize.w, height: imgSize.h, userSelect: 'none' }}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Crop preview"
            width={imgSize.w}
            height={imgSize.h}
            style={{ width: imgSize.w, height: imgSize.h, display: 'block' }}
            draggable={false}
          />

          {/* Dark mask — 4 strips around the crop box */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height: box.y, background:'rgba(0,0,0,0.62)' }} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, top: box.y + box.h, background:'rgba(0,0,0,0.62)' }} />
            <div style={{ position:'absolute', top: box.y, left:0, width: box.x, height: box.h, background:'rgba(0,0,0,0.62)' }} />
            <div style={{ position:'absolute', top: box.y, left: box.x + box.w, right:0, height: box.h, background:'rgba(0,0,0,0.62)' }} />
          </div>

          {/* Crop box border + move handle */}
          <div
            style={{
              position:   'absolute',
              left:        box.x,  top:    box.y,
              width:       box.w,  height: box.h,
              border:      '1.5px solid rgba(255,255,255,0.82)',
              boxSizing:  'border-box',
              cursor:     'move',
              touchAction:'none',
            }}
            onPointerDown={(e) => startDrag(e, 'move')}
          >
            {/* Rule-of-thirds grid */}
            <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
              <div style={{ position:'absolute', left:'33.33%', top:0, bottom:0, borderLeft:'1px solid rgba(255,255,255,0.18)' }} />
              <div style={{ position:'absolute', left:'66.66%', top:0, bottom:0, borderLeft:'1px solid rgba(255,255,255,0.18)' }} />
              <div style={{ position:'absolute', top:'33.33%', left:0, right:0, borderTop:'1px solid rgba(255,255,255,0.18)' }} />
              <div style={{ position:'absolute', top:'66.66%', left:0, right:0, borderTop:'1px solid rgba(255,255,255,0.18)' }} />
            </div>
          </div>

          {/* Corner resize handles */}
          {corners.map(([handle, lx, ty, cursor]) => (
            <div
              key={handle}
              style={handleStyle(lx, ty, cursor)}
              onPointerDown={(e) => startDrag(e, handle)}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-white/15 text-chrome-400 text-[11px] tracking-widest hover:border-white/35 hover:text-chrome-200 transition-colors select-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          CANCEL
        </button>
        <button
          onClick={handleCrop}
          disabled={!imgSize}
          className="px-6 py-2.5 rounded-lg bg-white text-black text-[11px] tracking-widest font-bold hover:bg-chrome-100 disabled:opacity-40 transition-colors select-none"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          CROP & UPLOAD
        </button>
      </div>
    </motion.div>
  )
}
