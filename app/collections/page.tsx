import { Suspense } from 'react'
import CollectionsClient from './CollectionsClient'

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-chrome-400 text-2xl tracking-widest animate-pulse" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            LOADING...
          </div>
        </div>
      }
    >
      <CollectionsClient />
    </Suspense>
  )
}
