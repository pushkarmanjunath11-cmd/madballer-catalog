'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Product } from '@/lib/store'
import { getWhatsAppLink } from '@/lib/whatsapp'

interface Props {
  product: Product
  onClose: () => void
}

const BADGE: Record<string, string> = {
  Boots:               'badge-boots',
  'Jackets/Tracksuit': 'badge-jackets',
}

export default function ProductModal({ product, onClose }: Props) {
  const allImages = [product.imageUrl, ...(product.images ?? [])].filter(Boolean)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)

  const prev = () => setCurrent((c) => (c - 1 + allImages.length) % allImages.length)
  const next = () => setCurrent((c) => (c + 1) % allImages.length)

  // Keyboard + body scroll lock
  useEffect(() => {
    const saved = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = saved
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) next()
    if (diff < -50) prev()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="glass-card-strong rounded-2xl overflow-hidden w-full max-w-sm silver-glow"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Main image */}
        <div className="relative aspect-square bg-[#111] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0"
            >
              <Image
                src={allImages[current]}
                alt={`Boot photo ${current + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/65 text-white text-lg flex items-center justify-center hover:bg-black/85 transition-colors"
          >✕</button>

          {/* Badge */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className={BADGE[product.category] ?? 'badge-boots'}>
              {product.category}
            </span>
          </div>

          {/* Arrow navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 text-white text-xl flex items-center justify-center hover:bg-black/85 transition-colors"
              >‹</button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/60 text-white text-xl flex items-center justify-center hover:bg-black/85 transition-colors"
              >›</button>
            </>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Counter pill */}
          {allImages.length > 1 && (
            <div
              className="absolute bottom-3 right-3 z-10 bg-black/60 rounded-full px-2 py-0.5 text-white text-[10px] tracking-widest pointer-events-none"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {current + 1}/{allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 px-3 pt-3 overflow-x-auto scrollbar-none">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === current ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}

        {/* Order button */}
        <div className="p-4 pt-3">
          <a
            href={getWhatsAppLink(undefined, product.imageUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-btn flex items-center justify-center gap-2 text-white text-sm font-semibold tracking-widest uppercase rounded-xl px-6 py-3.5 min-h-[52px] w-full"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
            </svg>
            ORDER ON WHATSAPP
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}
