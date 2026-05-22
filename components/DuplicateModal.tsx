'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Product } from '@/lib/store'

interface Props {
  matches: Product[]
  onProceed: () => void
  onCancel: () => void
}

export default function DuplicateModal({ matches, onProceed, onCancel }: Props) {
  const count = matches.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1,   y: 0  }}
        exit={{    scale: 0.9, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="glass-card-strong rounded-2xl p-6 sm:p-7 w-full max-w-[340px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">⚠️</span>
          <h2
            className="chrome-text text-xl tracking-widest"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            SIMILAR BOOT FOUND
          </h2>
        </div>

        {/* Explanation */}
        <p
          className="text-chrome-400 text-[11px] tracking-widest leading-relaxed mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {count === 1
            ? 'This image looks like a boot already in your catalog:'
            : `This image looks similar to ${count} boots already in your catalog:`}
        </p>

        {/* Matching thumbnails */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {matches.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-white/5 border border-white/10"
            >
              <Image
                src={p.imageUrl}
                alt="Existing boot"
                width={72}
                height={72}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Hint */}
        <p
          className="text-chrome-700 text-[10px] tracking-widest mb-5"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          IS THIS A DIFFERENT BOOT?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/15 text-chrome-400 text-[11px] tracking-widest hover:border-white/30 hover:text-chrome-200 transition-colors"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            CANCEL
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-2.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-[11px] tracking-widest hover:bg-yellow-500/20 transition-colors"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            ADD ANYWAY
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
