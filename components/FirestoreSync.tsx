'use client'

import { useEffect } from 'react'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useProductStore, Product, CategoryImages } from '@/lib/store'

export default function FirestoreSync() {
  const setProducts       = useProductStore((s) => s.setProducts)
  const setLoading        = useProductStore((s) => s.setLoading)
  const setCategoryImages = useProductStore((s) => s.setCategoryImages)

  useEffect(() => {
    setLoading(true)

    // ── Products real-time listener ──────────────────
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products: Product[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Product, 'id'>),
          id: d.id,
        }))
        products.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setProducts(products)
      },
      (err) => {
        console.error('Firestore products error:', err)
        setLoading(false)
      }
    )

    // ── Category images listener ─────────────────────
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'categoryImages'),
      (snap) => {
        if (snap.exists()) setCategoryImages(snap.data() as Partial<CategoryImages>)
      }
    )

    return () => {
      unsubProducts()
      unsubSettings()
    }
  }, [setProducts, setLoading, setCategoryImages])

  return null
}
