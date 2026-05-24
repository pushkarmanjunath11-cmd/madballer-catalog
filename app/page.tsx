'use client'

import { useRef, useMemo, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { useProductStore } from '@/lib/store'
import { getWhatsAppLink, WA_DISPLAY } from '@/lib/whatsapp'

const MARQUEE_ITEMS = [
  'BOOTS', 'PREMIUM', 'AUTHENTIC', 'LIMITED DROPS', 'FOOTBALL', 'MAD BALLERS', 'BALLER ZONE', 'TOP QUALITY',
]

const PAGE_SIZE = 20
const FEATURED_COUNT = 5

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
  </svg>
)

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])

  const products = useProductStore((s) => s.products)
  const loading  = useProductStore((s) => s.loading)

  // Random 5 picks — reshuffled fresh every page load
  const featured = useMemo(() => {
    if (products.length === 0) return []
    const shuffled = [...products].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(FEATURED_COUNT, shuffled.length))
  }, [products])

  // Pagination — show 20 at a time
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length
  const remaining = products.length - visibleCount

  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
      >
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <Image
            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1800&q=80"
            alt="Football stadium"
            fill
            priority
            className="object-cover"
          />
          {/* Base gradient — desktop level */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-[#0a0a0a]" />
          {/* Extra mobile-only veil so text pops against the image */}
          <div className="absolute inset-0 bg-black/40 sm:hidden pointer-events-none" />
        </motion.div>

        <div className="relative z-10 flex flex-col items-center text-center px-5 w-full max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden animate-glow-pulse mb-6 sm:mb-8 flex-shrink-0"
          >
            <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" priority />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="chrome-text hero-title leading-none w-full"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(52px, 14vw, 140px)', letterSpacing: '0.06em' }}
          >
            MAD BALLERS
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="w-32 sm:w-48 h-px bg-gradient-to-r from-transparent via-chrome-300 to-transparent my-3 sm:my-4"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="chrome-text hero-sub leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(20px, 5vw, 44px)', letterSpacing: '0.28em' }}
          >
            BALLER ZONE
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="hero-body text-chrome-400 text-sm sm:text-base mt-3 sm:mt-3 mb-7 sm:mb-9 px-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.14em' }}
          >
            Premium Football Boots — Authentic · Quality · Culture
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <a
              href="#boots"
              className="inline-flex items-center justify-center border-2 border-white/90 sm:border sm:border-chrome-400/50 hover:border-white text-white sm:text-chrome-200 hover:text-white bg-white/10 sm:bg-transparent hover:bg-white/15 px-7 py-3.5 tracking-widest text-sm uppercase transition-all duration-200 min-h-[48px] rounded sm:rounded-none font-semibold sm:font-normal"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              BROWSE BOOTS
            </a>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn inline-flex items-center justify-center gap-2 text-white px-7 py-3.5 tracking-widest text-sm uppercase font-semibold min-h-[48px] rounded"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {WA_ICON} ORDER NOW
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-chrome-600 text-[10px] tracking-[0.3em]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>SCROLL</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-px h-6 sm:h-8 bg-gradient-to-b from-chrome-400 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <section className="relative overflow-hidden border-t border-b border-white/[0.06] bg-[#0d0d0d] py-3 sm:py-4">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 sm:gap-5 pr-3 sm:pr-5" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              <span className="text-chrome-400 tracking-[0.18em] text-sm sm:text-lg whitespace-nowrap">{item}</span>
              <span className="text-chrome-600 text-[10px]">◆</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURED DROPS ── */}
      {!loading && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-chrome-600 text-xs tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              — TODAY&apos;S PICKS —
            </span>
            <h2 className="chrome-text" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 7vw, 80px)', letterSpacing: '0.06em' }}>
              FEATURED DROPS
            </h2>
            <p className="text-chrome-600 text-xs mt-2 tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Refreshes every visit
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── ALL BOOTS ── */}
      <section id="boots" className="bg-[#0d0d0d] border-t border-white/[0.04] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14"
          >
            <div>
              <span className="text-chrome-600 text-xs tracking-[0.3em] uppercase block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                — FULL COLLECTION —
              </span>
              <h2 className="chrome-text leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 7vw, 80px)', letterSpacing: '0.06em' }}>
                ALL BOOTS
              </h2>
            </div>
            {!loading && (
              <span className="inline-flex items-center gap-2 text-chrome-500 text-sm" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {products.length} {products.length === 1 ? 'PAIR' : 'PAIRS'} AVAILABLE
              </span>
            )}
          </motion.div>

          {loading ? (
            <div className="text-center text-chrome-600 text-sm tracking-widest animate-pulse py-14" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              LOADING...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-4">👟</p>
              <p className="text-chrome-500 text-lg tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>NO BOOTS AVAILABLE YET</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                <AnimatePresence initial={false}>
                  {visibleProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </AnimatePresence>
              </div>

              {/* View More / count */}
              <div className="mt-10 sm:mt-14 flex flex-col items-center gap-3">
                {hasMore ? (
                  <>
                    <p className="text-chrome-600 text-xs tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Showing {visibleCount} of {products.length} boots
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="inline-flex items-center gap-2.5 border border-white/20 hover:border-white/50 text-chrome-300 hover:text-white px-8 py-3.5 tracking-[0.2em] text-sm uppercase transition-all duration-200 hover:bg-white/5 rounded-full"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      VIEW MORE
                      <span className="text-chrome-600 text-xs">
                        +{Math.min(PAGE_SIZE, remaining)}
                      </span>
                    </motion.button>
                  </>
                ) : (
                  products.length > PAGE_SIZE && (
                    <p className="text-chrome-700 text-xs tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      All {products.length} boots shown
                    </p>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── WHATSAPP CTA ── */}
      <section className="relative overflow-hidden bg-[#080808] py-16 sm:py-24 border-t border-white/[0.04]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(37,211,102,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 mb-6 sm:mb-8"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-green-400 text-xs tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              WE&apos;RE AVAILABLE NOW
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="chrome-text leading-none mb-4 sm:mb-6"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(42px, 10vw, 110px)', letterSpacing: '0.06em' }}
          >
            READY TO ORDER?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-chrome-400 text-sm sm:text-base leading-relaxed mb-8 sm:mb-10"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em' }}
          >
            Chat with us on WhatsApp — we&apos;ll help you find the perfect boots.
            Fast replies, genuine gear, direct delivery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn inline-flex items-center justify-center gap-3 text-white font-semibold tracking-widest uppercase rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto text-sm sm:text-base"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
              </svg>
              CHAT &amp; ORDER
            </a>
            <a
              href={`tel:${WA_DISPLAY.replace(/\s/g, '')}`}
              className="text-green-400 text-lg sm:text-xl font-semibold tracking-wider hover:text-green-300 transition-colors"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {WA_DISPLAY}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
