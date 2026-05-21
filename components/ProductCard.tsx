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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      className="product-card glass-card rounded-xl overflow-hidden group"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {product.featured && (
          <span className="absolute top-2.5 right-2.5 text-yellow-400 text-base drop-shadow-lg">★</span>
        )}
        <span className="absolute top-2.5 left-2.5 badge-boots">Boots</span>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <h3
          className="text-white leading-tight text-base sm:text-lg"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          {product.name}
        </h3>

        <a
          href={getWhatsAppLink(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn flex items-center justify-center gap-2 text-white font-semibold tracking-widest text-xs uppercase rounded-lg py-2.5 sm:py-3 min-h-[42px]"
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
  )
}
