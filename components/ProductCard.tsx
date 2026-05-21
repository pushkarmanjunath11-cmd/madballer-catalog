'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Product } from '@/lib/store'
import { getWhatsAppLink } from '@/lib/whatsapp'

interface Props {
  product: Product
  index?: number
}

export default function ProductCard({ product, index = 0 }: Props) {
  const badgeClass =
    product.category === 'Boots'
      ? 'badge-boots'
      : product.category === 'Jerseys'
      ? 'badge-jerseys'
      : 'badge-essentials'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: 'easeOut' }}
      className="product-card glass-card rounded-xl overflow-hidden group"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured star */}
        {product.featured && (
          <span className="absolute top-3 right-3 text-yellow-400 text-lg drop-shadow-lg">★</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={badgeClass}>{product.category}</span>
        </div>

        <h3
          className="font-bebas tracking-wide text-xl text-white leading-tight"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          {product.name}
        </h3>

        <a
          href={getWhatsAppLink(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn block text-center text-white font-barlow font-semibold tracking-widest text-sm uppercase rounded-lg py-2.5 px-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          ORDER ON WHATSAPP
        </a>
      </div>
    </motion.div>
  )
}
