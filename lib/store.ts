'use client'

import { create } from 'zustand'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type Category = 'Boots' | 'Jackets/Tracksuit'

export interface CategoryImages {
  Boots: string
  'Jackets/Tracksuit': string
}

export interface Product {
  id: string
  name: string
  category: Category
  imageUrl: string
  images?: string[]
  createdAt: string
  /** aHash perceptual fingerprint (64-char binary string) — used for duplicate detection */
  fingerprint?: string
}

export const DEFAULT_CATEGORY_IMAGES: CategoryImages = {
  Boots:              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80',
  'Jackets/Tracksuit':'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=900&q=80',
}

interface ProductStore {
  products: Product[]
  loading: boolean
  categoryImages: CategoryImages
  setProducts: (products: Product[]) => void
  setLoading: (loading: boolean) => void
  setCategoryImages: (images: Partial<CategoryImages>) => void
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>
  removeProduct: (id: string) => Promise<void>
  updateCategoryImage: (category: Category, url: string) => Promise<void>
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: true,
  categoryImages: DEFAULT_CATEGORY_IMAGES,

  setProducts: (products) => set({ products, loading: false }),
  setLoading: (loading) => set({ loading }),
  setCategoryImages: (images) =>
    set((state) => ({ categoryImages: { ...state.categoryImages, ...images } })),

  addProduct: async (product) => {
    await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: new Date().toISOString(),
    })
  },

  removeProduct: async (id) => {
    await deleteDoc(doc(db, 'products', id))
  },

  updateCategoryImage: async (category, url) => {
    await setDoc(
      doc(db, 'settings', 'categoryImages'),
      { [category]: url },
      { merge: true }
    )
  },
}))
