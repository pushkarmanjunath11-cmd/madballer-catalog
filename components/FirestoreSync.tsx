'use client'

import { useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
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

    // ── One-time migration to real products (v2) ──────
    // v2: wipes old placeholder products and seeds the 28 real boots.
    // Once settings/seeded_v2 exists this block is never touched again.
    const seedIfNeeded = async () => {
      try {
        const seededSnap = await getDoc(doc(db, 'settings', 'seeded_v2'))
        if (seededSnap.exists()) return // already on v2 — skip

        // Delete every existing product (old placeholders)
        const existing = await getDocs(collection(db, 'products'))
        for (const d of existing.docs) {
          await deleteDoc(doc(db, 'products', d.id))
        }

        // Seed all 28 real products
        for (const p of SAMPLE_PRODUCTS) {
          await addDoc(collection(db, 'products'), p)
        }
        await setDoc(doc(db, 'settings', 'seeded_v2'), { at: new Date().toISOString() })
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
