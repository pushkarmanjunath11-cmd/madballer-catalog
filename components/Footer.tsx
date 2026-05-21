'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getWhatsAppLink, WA_DISPLAY, WA_LINK } from '@/lib/whatsapp'

export default function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-white/[0.06] pt-12 sm:pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10 sm:mb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden animate-glow-pulse flex-shrink-0">
                <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" />
              </div>
              <div>
                <div className="chrome-text text-xl tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  MAD BALLERS
                </div>
                <div className="text-chrome-500 text-xs tracking-[0.2em]">BALLER ZONE</div>
              </div>
            </div>
            <p className="text-chrome-500 text-sm leading-relaxed max-w-xs">
              Premium football boots — authentic gear for the true baller.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="chrome-text text-sm tracking-[0.2em] mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              NAVIGATION
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: 'Home', href: '/' },
                { label: 'Shop Boots', href: '/collections' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="animated-underline text-chrome-400 hover:text-white text-sm tracking-widest transition-colors w-fit"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="chrome-text text-sm tracking-[0.2em] mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ORDER &amp; CONTACT
            </h4>
            <p className="text-chrome-500 text-sm mb-3">
              We operate exclusively via WhatsApp. Chat with us to order.
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 font-semibold text-xl tracking-wider hover:text-green-300 transition-colors block mb-5"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {WA_DISPLAY}
            </a>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn inline-flex items-center gap-2 text-white text-xs font-semibold tracking-widest uppercase rounded-lg px-5 py-3 min-h-[44px]"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L.057 23.95l6.244-1.637A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.99-1.366l-.358-.212-3.708.973.989-3.616-.232-.372A9.818 9.818 0 0112 2.182c5.423 0 9.818 4.395 9.818 9.818 0 5.422-4.395 9.818-9.818 9.818z" />
              </svg>
              CHAT WITH US
            </a>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-chrome-600 text-xs tracking-widest text-center sm:text-left">
            © {new Date().getFullYear()} MAD BALLERS — BALLER ZONE. All rights reserved.
          </p>
          <p className="text-chrome-700 text-xs tracking-wider">PREMIUM FOOTBALL BOOTS</p>
        </div>
      </div>
    </footer>
  )
}
