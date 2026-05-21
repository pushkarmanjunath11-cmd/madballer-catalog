import type { Metadata } from 'next'
import './globals.css'
import CartProvider from './context/CartContext'
import FirestoreSync from '@/components/FirestoreSync'

export const metadata: Metadata = {
  title: 'MAD BALLERS — BALLER ZONE',
  description: 'Premium Football Culture — Boots · Jerseys · Essentials',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-white overflow-x-hidden">
        <CartProvider>
          {/* Real-time Firestore ↔ Zustand bridge — renders nothing */}
          <FirestoreSync />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
