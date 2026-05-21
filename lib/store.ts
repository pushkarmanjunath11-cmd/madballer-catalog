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

export type Category = 'Boots'

export interface CategoryImages {
  Boots: string
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
  Boots: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80',
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
    name: 'Nike Phantom Elite FG',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    createdAt: '2024-01-01T00:00:00Z',
    featured: true,
  },
  {
    name: 'Nike Mercurial Superfly Pro',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
    createdAt: '2024-01-02T00:00:00Z',
    featured: true,
  },
  {
    name: 'Adidas Predator Accuracy+',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=600&q=80',
    createdAt: '2024-01-03T00:00:00Z',
    featured: true,
  },
  {
    name: 'Adidas Copa Pure 2+',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&q=80',
    createdAt: '2024-01-04T00:00:00Z',
    featured: true,
  },
  {
    name: 'Adidas X Crazyfast Elite',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
    createdAt: '2024-01-05T00:00:00Z',
    featured: false,
  },
  {
    name: 'Nike Tiempo Legend 10',
    category: 'Boots',
    imageUrl: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80',
    createdAt: '2024-01-06T00:00:00Z',
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
  },
}))
