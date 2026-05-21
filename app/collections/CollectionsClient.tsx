'use client'

import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { useProductStore } from '@/lib/store'
import { getWhatsAppLink } from '@/lib/whatsapp'

export default function CollectionsClient() {
  const products = useProductStore((s) => s.products)
  const loading  = useProductStore((s) => s.loading)

  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-14"
        >
          <span className="text-chrome-600 text-xs tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            — FULL COLLECTION —
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h1
              className="chrome-text leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(48px, 10vw, 100px)', letterSpacing: '0.06em' }}
            >
              BOOTS
            </h1>
            {!loading && (
              <span className="inline-flex items-center gap-2 text-chrome-400 text-sm pb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                {products.length} {products.length === 1 ? 'PAIR' : 'PAIRS'} AVAILABLE
              </span>
            )}
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-chrome-600 text-sm tracking-widest animate-pulse py-20" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            LOADING...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-5">
            <span className="text-6xl">👟</span>
            <p className="text-chrome-500 text-xl tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              NO BOOTS AVAILABLE YET
            </p>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn inline-flex items-center gap-2 text-white text-sm font-semibold tracking-widest uppercase rounded-xl px-6 py-3"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              ASK US ON WHATSAPP
            </a>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  )
}
