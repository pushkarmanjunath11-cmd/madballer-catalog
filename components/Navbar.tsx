'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { getWhatsAppLink } from '@/lib/whatsapp'

const NAV_LINKS = [
  { label: 'HOME', href: '/' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-card-strong border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">

          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden animate-glow-pulse flex-shrink-0">
              <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" />
            </div>
            <div className="leading-none">
              <div
                className="chrome-text text-base sm:text-lg font-bold tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.15em' }}
              >
                MAD BALLERS
              </div>
              <div
                className="text-chrome-500 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                BALLER ZONE
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
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

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn hidden sm:inline-flex items-center gap-2 text-white text-xs font-semibold tracking-widest uppercase rounded-lg px-4 py-2.5 min-h-[38px]"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
              </svg>
              ORDER NOW
            </a>

            {/* Mobile WA button (icon only) */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden wa-btn w-9 h-9 rounded-full flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
              </svg>
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-2 -mr-1"
              aria-label="Open menu"
            >
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-chrome-300" />
                <span className="block w-4 h-0.5 bg-chrome-300 ml-auto" />
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
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#080808] flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden">
                  <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" />
                </div>
                <span className="chrome-text text-base tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  MAD BALLERS
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-chrome-400 hover:text-white text-2xl leading-none w-10 h-10 flex items-center justify-center"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col flex-1 justify-center px-8 gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="chrome-text block py-4 border-b border-white/[0.06]"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 10vw, 56px)', letterSpacing: '0.1em' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom WA button */}
            <div className="px-8 pb-10">
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn flex items-center justify-center gap-3 text-white text-sm font-semibold tracking-widest uppercase rounded-2xl px-8 py-4 min-h-[56px] w-full"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                onClick={() => setMenuOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
                </svg>
                ORDER ON WHATSAPP
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
