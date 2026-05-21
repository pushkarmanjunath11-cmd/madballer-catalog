'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { useProductStore, Category } from '@/lib/store'

const TABS: (Category | 'All')[] = ['All', 'Boots', 'Jerseys', 'Essentials']

export default function CollectionsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawCat = searchParams.get('cat')
  const activeCat: Category | 'All' =
    rawCat && TABS.includes(rawCat as Category) ? (rawCat as Category) : 'All'

  const products = useProductStore((s) => s.products)
  const loading = useProductStore((s) => s.loading)
  const filtered =
    activeCat === 'All' ? products : products.filter((p) => p.category === activeCat)

  const setTab = (tab: Category | 'All') => {
    if (tab === 'All') {
      router.push('/collections')
    } else {
      router.push(`/collections?cat=${tab}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center relative"
        >
          {/* Decorative large number */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden
          >
            <span
              className="text-[160px] sm:text-[220px] font-bold text-white/[0.03] leading-none"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              {filtered.length}
            </span>
          </div>

          <span
            className="text-chrome-600 text-xs tracking-[0.35em] uppercase block mb-3 relative"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            — BROWSE ALL —
          </span>
          <h1
            className="chrome-text relative"
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(48px, 8vw, 100px)',
              letterSpacing: '0.06em',
            }}
          >
            COLLECTIONS
          </h1>

          {/* Item count with pulsing dot */}
          <div className="inline-flex items-center gap-2 mt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-chrome-400 text-sm tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {filtered.length} {filtered.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-12 justify-center"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-6 py-2 text-sm tracking-widest uppercase transition-all duration-200 rounded-full ${
                activeCat === tab
                  ? 'bg-white text-black font-semibold'
                  : 'border border-white/20 text-chrome-300 hover:border-white/40 hover:text-white'
              }`}
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {loading ? (
              <div className="text-center text-chrome-600 text-sm tracking-widest animate-pulse py-24" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                LOADING FROM FIREBASE...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <span className="text-6xl">⚽</span>
                <p
                  className="text-chrome-500 text-xl tracking-widest"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  NO PRODUCTS IN THIS CATEGORY YET
                </p>
                <button
                  onClick={() => setTab('All')}
                  className="text-chrome-400 text-sm tracking-widest underline hover:text-white transition-colors"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  )
}
