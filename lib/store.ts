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
  images?: string[]
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
  { name: 'Nike Mercurial Vapor 15 Elite FG – KM Blue', category: 'Boots', imageUrl: '/boots/p01-01.jpg', images: ['/boots/p01-02.jpg'], createdAt: '2026-05-21T20:53:00Z', featured: true },
  { name: 'Nike Phantom GX II Alpha Elite FG – Pink/Black', category: 'Boots', imageUrl: '/boots/p02-01.jpg', images: ['/boots/p02-02.jpg', '/boots/p02-03.jpg', '/boots/p02-04.jpg'], createdAt: '2026-05-21T20:53:01Z', featured: true },
  { name: 'Adidas Copa Pure 2+ FG – Black/Volt', category: 'Boots', imageUrl: '/boots/p03-01.jpg', images: ['/boots/p03-02.jpg', '/boots/p03-03.jpg'], createdAt: '2026-05-21T20:53:02Z', featured: false },
  { name: 'Adidas Copa Pure 2+ FG – White/Black/Gold', category: 'Boots', imageUrl: '/boots/p04-01.jpg', images: ['/boots/p04-02.jpg', '/boots/p04-03.jpg', '/boots/p04-04.jpg'], createdAt: '2026-05-21T20:53:03Z', featured: true },
  { name: 'Adidas Predator Elite LL FG – Pink', category: 'Boots', imageUrl: '/boots/p05-01.jpg', images: ['/boots/p05-02.jpg', '/boots/p05-03.jpg', '/boots/p05-04.jpg'], createdAt: '2026-05-21T20:53:04Z', featured: false },
  { name: 'Adidas F50 Elite FG – Black/Volt', category: 'Boots', imageUrl: '/boots/p06-01.jpg', images: ['/boots/p06-02.jpg', '/boots/p06-03.jpg'], createdAt: '2026-05-21T20:53:05Z', featured: false },
  { name: 'Adidas F50 Elite FG – Lilac/Purple', category: 'Boots', imageUrl: '/boots/p07-01.jpg', images: ['/boots/p07-02.jpg', '/boots/p07-03.jpg', '/boots/p07-04.jpg'], createdAt: '2026-05-21T20:53:06Z', featured: false },
  { name: 'Adidas Predator Elite FG – Grey/Solar Red', category: 'Boots', imageUrl: '/boots/p08-01.jpg', images: ['/boots/p08-02.jpg', '/boots/p08-03.jpg', '/boots/p08-04.jpg'], createdAt: '2026-05-21T20:53:07Z', featured: false },
  { name: 'Adidas Copa Pure 2+ FG – White/Royal Blue', category: 'Boots', imageUrl: '/boots/p09-01.jpg', images: ['/boots/p09-02.jpg', '/boots/p09-03.jpg', '/boots/p09-04.jpg'], createdAt: '2026-05-21T20:53:08Z', featured: false },
  { name: 'Nike Phantom GX II Elite FG – Royal Blue', category: 'Boots', imageUrl: '/boots/p10-01.jpg', images: ['/boots/p10-02.jpg', '/boots/p10-03.jpg', '/boots/p10-04.jpg'], createdAt: '2026-05-21T20:53:09Z', featured: false },
  { name: 'Nike Mercurial Vapor 16 Elite FG – Crimson Splatter', category: 'Boots', imageUrl: '/boots/p11-01.jpg', images: ['/boots/p11-02.jpg', '/boots/p11-03.jpg'], createdAt: '2026-05-21T20:53:10Z', featured: true },
  { name: 'Adidas Predator Elite LL FG – White/Blue', category: 'Boots', imageUrl: '/boots/p12-01.jpg', images: ['/boots/p12-02.jpg', '/boots/p12-03.jpg', '/boots/p12-04.jpg'], createdAt: '2026-05-21T20:53:11Z', featured: false },
  { name: 'Nike Phantom GX II Elite FG – Black/Blue', category: 'Boots', imageUrl: '/boots/p13-01.jpg', images: ['/boots/p13-02.jpg', '/boots/p13-03.jpg', '/boots/p13-04.jpg'], createdAt: '2026-05-21T20:53:12Z', featured: false },
  { name: 'Nike Mercurial Vapor 16 Elite FG – Volt', category: 'Boots', imageUrl: '/boots/p14-01.jpg', images: ['/boots/p14-02.jpg', '/boots/p14-03.jpg', '/boots/p14-04.jpg'], createdAt: '2026-05-21T20:53:13Z', featured: true },
  { name: 'Adidas Predator Elite LL FG – White/Red', category: 'Boots', imageUrl: '/boots/p15-01.jpg', images: ['/boots/p15-02.jpg', '/boots/p15-03.jpg', '/boots/p15-04.jpg'], createdAt: '2026-05-21T20:53:14Z', featured: false },
  { name: 'Nike Air Zoom Mercurial Superfly 10 Elite FG – Pink Beam', category: 'Boots', imageUrl: '/boots/p16-01.jpg', images: ['/boots/p16-02.jpg', '/boots/p16-03.jpg', '/boots/p16-04.jpg'], createdAt: '2026-05-21T20:53:15Z', featured: true },
  { name: 'Adidas F50 Elite FG – White/Blue/Gold', category: 'Boots', imageUrl: '/boots/p17-01.jpg', images: ['/boots/p17-02.jpg', '/boots/p17-03.jpg', '/boots/p17-04.jpg'], createdAt: '2026-05-21T20:53:16Z', featured: false },
  { name: 'Puma Ultra Ultimate FG – Volt/Black', category: 'Boots', imageUrl: '/boots/p18-01.jpg', images: ['/boots/p18-02.jpg', '/boots/p18-03.jpg', '/boots/p18-04.jpg'], createdAt: '2026-05-21T20:53:17Z', featured: false },
  { name: 'Mizuno Morelia Neo IV Elite FG – Coral Red', category: 'Boots', imageUrl: '/boots/p19-01.jpg', images: ['/boots/p19-02.jpg', '/boots/p19-03.jpg', '/boots/p19-04.jpg'], createdAt: '2026-05-21T20:53:18Z', featured: false },
  { name: 'Mizuno Morelia Neo IV Elite FG – Crimson Red', category: 'Boots', imageUrl: '/boots/p20-01.jpg', images: ['/boots/p20-02.jpg', '/boots/p20-03.jpg'], createdAt: '2026-05-21T20:53:19Z', featured: false },
  { name: 'Nike Phantom GX II Elite FG – Cobblestone', category: 'Boots', imageUrl: '/boots/p21-01.jpg', images: ['/boots/p21-02.jpg', '/boots/p21-03.jpg', '/boots/p21-04.jpg'], createdAt: '2026-05-21T20:53:20Z', featured: false },
  { name: 'Adidas Predator Elite FG – White/Coral Red', category: 'Boots', imageUrl: '/boots/p22-01.jpg', images: ['/boots/p22-02.jpg'], createdAt: '2026-05-21T20:53:21Z', featured: false },
  { name: 'Nike Mercurial Vapor 16 Elite FG – Hot Pink', category: 'Boots', imageUrl: '/boots/p23-01.jpg', images: ['/boots/p23-02.jpg', '/boots/p23-03.jpg'], createdAt: '2026-05-21T20:54:48Z', featured: true },
  { name: 'Nike Phantom GX II Elite FG – All Black', category: 'Boots', imageUrl: '/boots/p24-01.jpg', images: ['/boots/p24-02.jpg', '/boots/p24-03.jpg'], createdAt: '2026-05-21T20:54:49Z', featured: false },
  { name: 'Nike Air Zoom Mercurial Superfly 10 Elite FG – Black/Pink', category: 'Boots', imageUrl: '/boots/p25-01.jpg', images: ['/boots/p25-02.jpg', '/boots/p25-03.jpg', '/boots/p25-04.jpg'], createdAt: '2026-05-21T20:54:50Z', featured: false },
  { name: 'Nike Mercurial Vapor 16 Elite FG – Purple/Crimson', category: 'Boots', imageUrl: '/boots/p26-01.jpg', images: ['/boots/p26-02.jpg', '/boots/p26-03.jpg', '/boots/p26-04.jpg'], createdAt: '2026-05-21T20:54:51Z', featured: false },
  { name: 'Nike Mercurial Vapor 16 Elite FG – Crimson/Black', category: 'Boots', imageUrl: '/boots/p27-01.jpg', images: ['/boots/p27-02.jpg', '/boots/p27-03.jpg', '/boots/p27-04.jpg'], createdAt: '2026-05-21T20:54:52Z', featured: true },
  { name: 'Adidas Predator Elite FG – White/Red Est.1994', category: 'Boots', imageUrl: '/boots/p28-01.jpg', images: ['/boots/p28-02.jpg'], createdAt: '2026-05-21T20:54:53Z', featured: false },
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
