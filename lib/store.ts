'use client'

import { create } from 'zustand'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type Category = 'Boots' | 'Jerseys' | 'Essentials'

export interface CategoryImages {
  Boots: string
  Jerseys: string
  Essentials: string
}

export interface Product {
  id: string
  name: string
  category: Category
  imageUrl: string
  createdAt: string
  featured: boolean
}

export const DEFAULT_CATEGORY_IMAGES: CategoryImages = {
  Boots:      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80',
  Jerseys:    'https://images.unsplash.com/photo-1551958219-acbc595b2f35?w=900&q=80',
  Essentials: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80',
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
  toggleFeatured: (id: string) => Promise<void>
  updateCategoryImage: (category: Category, url: string) => Promise<void>
}

export const SAMPLE_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Phantom Elite FG',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    createdAt: '2024-01-01T00:00:00Z',
    featured: true,
  },
  {
    name: 'Mercurial Superfly Pro',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
    createdAt: '2024-01-02T00:00:00Z',
    featured: true,
  },
  {
    name: 'FC Barcelona Home Kit',
    category: 'Jerseys',
    imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc595b2f35?w=600&q=80',
    createdAt: '2024-01-03T00:00:00Z',
    featured: true,
  },
  {
    name: 'Real Madrid Away Jersey',
    category: 'Jerseys',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
    createdAt: '2024-01-04T00:00:00Z',
    featured: true,
  },
  {
    name: 'Pro Training Grip Socks',
    category: 'Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    createdAt: '2024-01-05T00:00:00Z',
    featured: false,
  },
  {
    name: 'Predator Accuracy.1',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=600&q=80',
    createdAt: '2024-01-06T00:00:00Z',
    featured: false,
  },
  {
    name: 'Brazil World Cup Shirt',
    category: 'Jerseys',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80',
    createdAt: '2024-01-07T00:00:00Z',
    featured: false,
  },
  {
    name: 'Match Day Shin Guards',
    category: 'Essentials',
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
    createdAt: '2024-01-08T00:00:00Z',
    featured: false,
  },
]

export const useProductStore = create<ProductStore>((set, get) => ({
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

  toggleFeatured: async (id) => {
    const product = get().products.find((p) => p.id === id)
    if (!product) return
    await updateDoc(doc(db, 'products', id), { featured: !product.featured })
  },

  updateCategoryImage: async (category, url) => {
    await setDoc(
      doc(db, 'settings', 'categoryImages'),
      { [category]: url },
      { merge: true }
    )
    // onSnapshot in FirestoreSync will update local state
  },
}))
