'use client'

import { useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useProductStore, Product, SAMPLE_PRODUCTS, CategoryImages } from '@/lib/store'

export default function FirestoreSync() {
  const setProducts      = useProductStore((s) => s.setProducts)
  const setLoading       = useProductStore((s) => s.setLoading)
  const setCategoryImages = useProductStore((s) => s.setCategoryImages)

  useEffect(() => {
    setLoading(true)

    // ── One-time seed (only if never seeded before) ──
    // Uses settings/seeded flag so deleting all products won't re-seed.
    const seedIfNeeded = async () => {
      try {
        const seededSnap = await getDoc(doc(db, 'settings', 'seeded'))
        if (seededSnap.exists()) return // already seeded — don't touch

        const existing = await getDocs(collection(db, 'products'))
        if (!existing.empty) {
          // Products exist but flag is missing — just write the flag
          await setDoc(doc(db, 'settings', 'seeded'), { at: new Date().toISOString() })
          return
        }

        // Fresh database — add sample products
        for (const p of SAMPLE_PRODUCTS) {
          await addDoc(collection(db, 'products'), p)
        }
        await setDoc(doc(db, 'settings', 'seeded'), { at: new Date().toISOString() })
      } catch (err) {
        console.warn('Seed skipped (Firestore rules may be locked):', err)
      }
    }

    seedIfNeeded()

    // ── Products real-time listener ──────────────────
    // No seeding here — deleting all products stays empty.
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
