'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Product } from '@/lib/store'
import { getWhatsAppLink } from '@/lib/whatsapp'
import ProductModal from './ProductModal'

interface Props {
  product: Product
  index?: number
}

const BADGE: Record<string, string> = {
  Boots:   'badge-boots',
  Jackets: 'badge-jackets',
}

export default function ProductCard({ product, index = 0 }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const totalImages = 1 + (product.images?.length ?? 0)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.35), ease: 'easeOut' }}
        className="product-card glass-card rounded-xl overflow-hidden group cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative overflow-hidden aspect-square bg-[#111]">
          <Image
            src={product.imageUrl}
            alt="Football boot"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge */}
          <span className={`absolute top-2.5 left-2.5 ${BADGE[product.category] ?? 'badge-boots'}`}>
            {product.category}
          </span>

          {/* Multiple images badge */}
          {totalImages > 1 && (
            <span
              className="absolute bottom-2.5 right-2.5 bg-black/65 rounded-full px-2 py-0.5 text-white text-[10px] tracking-widest flex items-center gap-1"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              {totalImages}
            </span>
          )}

          {/* Tap to view overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-xs tracking-widest bg-black/60 rounded-full px-3 py-1.5"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              TAP TO VIEW
            </span>
          </div>
        </div>

        {/* Order button */}
        <div className="p-3 sm:p-4">
          <a
            href={getWhatsAppLink(undefined, product.imageUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="wa-btn flex items-center justify-center gap-2 text-white font-semibold tracking-widest text-xs uppercase rounded-lg py-3 sm:py-3 min-h-[48px]"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
            </svg>
            ORDER NOW
          </a>
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <ProductModal product={product} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
