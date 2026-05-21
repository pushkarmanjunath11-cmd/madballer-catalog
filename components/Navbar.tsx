'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { getWhatsAppLink } from '@/lib/whatsapp'

const NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'BOOTS', href: '/collections?cat=Boots' },
  { label: 'JERSEYS', href: '/collections?cat=Jerseys' },
  { label: 'ESSENTIALS', href: '/collections?cat=Essentials' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-card-strong border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden animate-glow-pulse flex-shrink-0">
              <Image
                src="/logo.png"
                alt="MAD BALLERS"
                fill
                className="object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement
                  t.style.display = 'none'
                  const parent = t.parentElement
                  if (parent) {
                    parent.style.background = 'linear-gradient(135deg,#333,#111)'
                    parent.style.display = 'flex'
                    parent.style.alignItems = 'center'
                    parent.style.justifyContent = 'center'
                    parent.innerHTML = '<span style="font-family:Bebas Neue,sans-serif;color:#c0c0c0;font-size:13px;letter-spacing:1px">MB</span>'
                  }
                }}
              />
            </div>
            <div className="leading-none">
              <div
                className="chrome-text text-lg font-bold tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.15em' }}
              >
                MAD BALLERS
              </div>
              <div
                className="text-chrome-400 text-xs tracking-[0.25em] uppercase"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                BALLER ZONE
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="animated-underline text-chrome-300 hover:text-white text-sm tracking-widest transition-colors duration-200"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.12em' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn hidden md:inline-flex items-center gap-2 text-white text-xs font-semibold tracking-widest uppercase rounded-lg px-4 py-2"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
              </svg>
              ORDER NOW
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-2"
              aria-label="Open menu"
            >
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-chrome-300" />
                <span className="block w-4 h-0.5 bg-chrome-300" />
                <span className="block w-6 h-0.5 bg-chrome-300" />
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-6">
              <button
                onClick={() => setMenuOpen(false)}
                className="text-chrome-300 hover:text-white text-3xl leading-none"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-center mb-12">
              <div className="relative w-16 h-16 rounded-full overflow-hidden animate-glow-pulse mb-4">
                <Image src="/logo.png" alt="MAD BALLERS" fill className="object-cover" />
              </div>
              <div
                className="chrome-text text-3xl tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                MAD BALLERS
              </div>
              <div className="text-chrome-500 text-xs tracking-[0.3em] mt-1">BALLER ZONE</div>
            </div>

            {/* Links */}
            <nav className="flex flex-col items-center gap-6 flex-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="chrome-text text-4xl tracking-widest animated-underline"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6"
              >
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-btn inline-flex items-center gap-2 text-white text-sm font-semibold tracking-widest uppercase rounded-xl px-8 py-3"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  onClick={() => setMenuOpen(false)}
                >
                  ORDER ON WHATSAPP
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
