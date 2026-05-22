'use client'

import { useState, useRef, useEffect } from 'react'

type Handle = 'new' | 'move' | 'tl' | 'tr' | 'bl' | 'br'
interface Box { x: number; y: number; w: number; h: number } // all in % of container

interface Props {
  src: string
  file: File
  onConfirm: (croppedFile: File, preview: string) => void
  onCancel: () => void
}

const MIN_PCT = 3 // minimum crop size in %

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export default function CropModal({ src, file, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const drag         = useRef<{ handle: Handle; mx0: number; my0: number; box0: Box } | null>(null)

  const [box,       setBox]       = useState<Box>({ x: 5, y: 5, w: 90, h: 90 })
  const [imgLoaded, setImgLoaded] = useState(false)

  // Reset to full-image selection once image loads
  useEffect(() => {
    if (imgLoaded) setBox({ x: 5, y: 5, w: 90, h: 90 })
  }, [imgLoaded])

  // ── Drag start helpers ────────────────────────────────
  function startHandle(e: React.MouseEvent, handle: Handle) {
    drag.current = { handle, mx0: e.clientX, my0: e.clientY, box0: { ...box } }
    e.preventDefault()
    e.stopPropagation()
  }

  function onContainerDown(e: React.MouseEvent) {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width * 100
    const py = (e.clientY - r.top)  / r.height * 100
    const newBox = { x: px, y: py, w: 0, h: 0 }
    setBox(newBox)
    drag.current = { handle: 'new', mx0: e.clientX, my0: e.clientY, box0: newBox }
    e.preventDefault()
  }

  // ── Global mouse/touch move & up ──────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!drag.current || !containerRef.current) return
      const ev = 'touches' in e ? e.touches[0] : e
      const r  = containerRef.current.getBoundingClientRect()
      const dx = (ev.clientX - drag.current.mx0) / r.width  * 100
      const dy = (ev.clientY - drag.current.my0) / r.height * 100
      const b  = drag.current.box0

      setBox(() => {
        let { x, y, w, h } = b
        switch (drag.current!.handle) {
          case 'new': {
            const rw = clamp(dx, -b.x, 100 - b.x)
            const rh = clamp(dy, -b.y, 100 - b.y)
            x = rw < 0 ? b.x + rw : b.x
            y = rh < 0 ? b.y + rh : b.y
            w = Math.abs(rw); h = Math.abs(rh)
            break
          }
          case 'move':
            x = clamp(b.x + dx, 0, 100 - b.w)
            y = clamp(b.y + dy, 0, 100 - b.h)
            break
          case 'br':
            w = clamp(b.w + dx, MIN_PCT, 100 - b.x)
            h = clamp(b.h + dy, MIN_PCT, 100 - b.y)
            break
          case 'bl': {
            const nx = clamp(b.x + dx, 0, b.x + b.w - MIN_PCT)
            w = b.w - (nx - b.x); x = nx
            h = clamp(b.h + dy, MIN_PCT, 100 - b.y)
            break
          }
          case 'tr': {
            const ny = clamp(b.y + dy, 0, b.y + b.h - MIN_PCT)
            h = b.h - (ny - b.y); y = ny
            w = clamp(b.w + dx, MIN_PCT, 100 - b.x)
            break
          }
          case 'tl': {
            const nx = clamp(b.x + dx, 0, b.x + b.w - MIN_PCT)
            const ny = clamp(b.y + dy, 0, b.y + b.h - MIN_PCT)
            w = b.w - (nx - b.x); x = nx
            h = b.h - (ny - b.y); y = ny
            break
          }
        }
        return { x, y, w, h }
      })
    }
    function onUp() { drag.current = null }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onUp)
    }
  }, [])

  // ── Preset buttons ────────────────────────────────────
  function snapSquare() {
    setBox(b => {
      const s = Math.min(b.w, b.h)
      const cx = b.x + b.w / 2
      const cy = b.y + b.h / 2
      const x = clamp(cx - s / 2, 0, 100 - s)
      const y = clamp(cy - s / 2, 0, 100 - s)
      return { x, y, w: s, h: s }
    })
  }
  function resetFull() { setBox({ x: 5, y: 5, w: 90, h: 90 }) }

  // ── Export crop ───────────────────────────────────────
  function handleConfirm() {
    const img = imgRef.current
    const con = containerRef.current
    if (!img || !con) return

    const cw = con.clientWidth, ch = con.clientHeight
    const nw = img.naturalWidth,  nh = img.naturalHeight

    // Calculate object-contain letterbox offsets
    const imgAspect = nw / nh, conAspect = cw / ch
    let rW: number, rH: number, ox: number, oy: number
    if (imgAspect > conAspect) {
      rW = cw; rH = cw / imgAspect; ox = 0; oy = (ch - rH) / 2
    } else {
      rH = ch; rW = ch * imgAspect; ox = (cw - rW) / 2; oy = 0
    }

    // Box % → container px → image natural px
    const bxPx = box.x / 100 * cw
    const byPx = box.y / 100 * ch
    const bwPx = box.w / 100 * cw
    const bhPx = box.h / 100 * ch

    const sx = Math.round((bxPx - ox) / rW * nw)
    const sy = Math.round((byPx - oy) / rH * nh)
    const sw = Math.round(bwPx / rW * nw)
    const sh = Math.round(bhPx / rH * nh)

    const cx2 = Math.max(0, sx)
    const cy2 = Math.max(0, sy)
    const cw2 = Math.min(sw, nw - cx2)
    const ch2 = Math.min(sh, nh - cy2)
    if (cw2 <= 0 || ch2 <= 0) return

    const canvas = document.createElement('canvas')
    canvas.width = cw2; canvas.height = ch2
    canvas.getContext('2d')!.drawImage(img, cx2, cy2, cw2, ch2, 0, 0, cw2, ch2)

    canvas.toBlob((blob) => {
      if (!blob) return
      const cropped = new File(
        [blob],
        file.name.replace(/\.\w+$/, '_crop.jpg'),
        { type: 'image/jpeg' }
      )
      onConfirm(cropped, canvas.toDataURL('image/jpeg', 0.92))
    }, 'image/jpeg', 0.92)
  }

  const HANDLE = 'absolute w-3.5 h-3.5 bg-white rounded-sm border border-black/50 z-20 touch-none'

  return (
    <div className="fixed inset-0 z-[300] bg-black/96 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4 overflow-auto">

      {/* Title */}
      <div className="text-center flex-shrink-0">
        <p className="text-white text-2xl tracking-[0.2em]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          CROP IMAGE
        </p>
        <p className="text-chrome-600 text-[10px] tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          Draw a new selection · Drag corners to resize · Drag inside to move
        </p>
      </div>

      {/* ── Crop canvas ── */}
      <div
        ref={containerRef}
        className="relative bg-[#0d0d0d] select-none flex-shrink-0"
        style={{ width: '100%', maxWidth: 500, aspectRatio: '4 / 3', cursor: 'crosshair' }}
        onMouseDown={onContainerDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Dim outside crop */}
        {box.w > 0 && (
          <>
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: 0, left: 0, right: 0, height: `${box.y}%` }} />
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: `${box.y + box.h}%`, left: 0, right: 0, bottom: 0 }} />
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: `${box.y}%`, left: 0, width: `${box.x}%`, height: `${box.h}%` }} />
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: `${box.y}%`, left: `${box.x + box.w}%`, right: 0, height: `${box.h}%` }} />
          </>
        )}

        {/* Crop box */}
        {box.w > 1 && box.h > 1 && (
          <div
            className="absolute border-2 border-white overflow-hidden"
            style={{
              left: `${box.x}%`, top: `${box.y}%`,
              width: `${box.w}%`, height: `${box.h}%`,
              cursor: 'move', boxSizing: 'border-box',
            }}
            onMouseDown={(e) => startHandle(e, 'move')}
          >
            {/* Rule-of-thirds grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), ' +
                'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
              backgroundSize: '33.33% 33.33%',
            }} />

            {/* Corner handles */}
            <div className={HANDLE} style={{ top: -6, left: -6, cursor: 'nwse-resize' }}
              onMouseDown={(e) => startHandle(e, 'tl')} />
            <div className={HANDLE} style={{ top: -6, right: -6, cursor: 'nesw-resize' }}
              onMouseDown={(e) => startHandle(e, 'tr')} />
            <div className={HANDLE} style={{ bottom: -6, left: -6, cursor: 'nesw-resize' }}
              onMouseDown={(e) => startHandle(e, 'bl')} />
            <div className={HANDLE} style={{ bottom: -6, right: -6, cursor: 'nwse-resize' }}
              onMouseDown={(e) => startHandle(e, 'br')} />
          </div>
        )}
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2 flex-shrink-0">
        <button type="button" onClick={resetFull}
          className="px-4 py-1.5 text-[10px] tracking-widest rounded-full border border-white/20 text-chrome-400 hover:border-white/40 hover:text-white transition-all"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >FULL IMAGE</button>
        <button type="button" onClick={snapSquare}
          className="px-4 py-1.5 text-[10px] tracking-widest rounded-full border border-white/20 text-chrome-400 hover:border-white/40 hover:text-white transition-all"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >SNAP TO SQUARE ★</button>
      </div>

      <p className="text-chrome-700 text-[9px] tracking-widest -mt-2 flex-shrink-0" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
        TIP: Square crop looks best on the website
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 flex-shrink-0">
        <button type="button" onClick={onCancel}
          className="border border-white/20 text-chrome-400 px-6 py-2.5 text-xs tracking-widest uppercase rounded-full hover:text-white hover:border-white/40 transition-all"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >CANCEL</button>
        <button type="button" onClick={handleConfirm}
          disabled={box.w < 2 || box.h < 2}
          className="bg-white text-black px-8 py-2.5 text-xs tracking-widest uppercase font-semibold rounded-full hover:bg-chrome-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >USE CROP ✓</button>
      </div>
    </div>
  )
}
