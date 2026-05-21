'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useProductStore, Category, Product } from '@/lib/store'

const ADMIN_PASSWORD = 'madballers2024'
const CATEGORIES: Category[] = ['Boots', 'Jerseys', 'Essentials']

type Tab = 'upload' | 'manage' | 'categories'

// ── Reusable upload helper ───────────────────────────
function uploadToStorage(file: File, onProgress: (n: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}

// ── Logo image ───────────────────────────────────────
function LogoImg({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-20 h-20' : 'w-9 h-9'
  return (
    <div className={`relative ${cls} rounded-full overflow-hidden flex-shrink-0 ${size === 'lg' ? 'animate-glow-pulse border border-white/10' : ''}`}>
      <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" />
    </div>
  )
}

export default function AdminPage() {
  // ── Auth ──────────────────────────────────────────
  const [authed, setAuthed]   = useState(false)
  const [password, setPassword] = useState('')
  const [wrongPw, setWrongPw] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  // ── Navigation ────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  // ── Upload product form ───────────────────────────
  const [name, setName]         = useState('')
  const [category, setCategory] = useState<Category>('Boots')
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Manage products ───────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  // ── Category images ───────────────────────────────
  const [catUrls, setCatUrls] = useState<Record<Category, string>>({ Boots: '', Jerseys: '', Essentials: '' })
  const [catFiles, setCatFiles] = useState<Record<Category, File | null>>({ Boots: null, Jerseys: null, Essentials: null })
  const [catPreviews, setCatPreviews] = useState<Record<Category, string>>({ Boots: '', Jerseys: '', Essentials: '' })
  const [catSaving, setCatSaving] = useState<Record<Category, boolean>>({ Boots: false, Jerseys: false, Essentials: false })
  const [catSuccess, setCatSuccess] = useState<Record<Category, boolean>>({ Boots: false, Jerseys: false, Essentials: false })
  const catFileRefs = { Boots: useRef<HTMLInputElement>(null), Jerseys: useRef<HTMLInputElement>(null), Essentials: useRef<HTMLInputElement>(null) }

  const { products, loading, categoryImages, addProduct, removeProduct, toggleFeatured, updateCategoryImage } = useProductStore()

  // ── Helpers ───────────────────────────────────────
  const badgeClass = (cat: Category) =>
    cat === 'Boots' ? 'badge-boots' : cat === 'Jerseys' ? 'badge-jerseys' : 'badge-essentials'

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setWrongPw(false) }
    else { setWrongPw(true); setShakeKey((k) => k + 1); setPassword('') }
  }

  // ── Product upload ────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewSrc(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || (!imageUrl && !imageFile)) return
    setUploading(true); setUploadError('')
    try {
      let finalUrl = imageUrl
      if (imageMode === 'file' && imageFile) finalUrl = await uploadToStorage(imageFile, setUploadPct)
      await addProduct({ name: name.trim(), category, imageUrl: finalUrl, featured: false })
      setName(''); setImageUrl(''); setImageFile(null); setPreviewSrc(''); setUploadPct(0)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch { setUploadError('Upload failed — check Firestore/Storage rules.') }
    finally { setUploading(false) }
  }

  // ── Product delete ────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleteError('')
    try {
      await removeProduct(id)
      setConfirmDeleteId(null)
    } catch (err) {
      console.error('Delete error:', err)
      setDeleteError('Firestore blocked the delete — check your security rules.')
      setConfirmDeleteId(null)
    }
  }

  // ── Category image save ───────────────────────────
  const handleSaveCatImage = async (cat: Category) => {
    setCatSaving((p) => ({ ...p, [cat]: true }))
    try {
      let url = catUrls[cat] || categoryImages[cat]
      const file = catFiles[cat]
      if (file) {
        url = await uploadToStorage(file, () => {})
        setCatPreviews((p) => ({ ...p, [cat]: url }))
        setCatFiles((p) => ({ ...p, [cat]: null }))
      }
      await updateCategoryImage(cat, url)
      setCatSuccess((p) => ({ ...p, [cat]: true }))
      setTimeout(() => setCatSuccess((p) => ({ ...p, [cat]: false })), 3000)
    } catch { /* silent */ }
    finally { setCatSaving((p) => ({ ...p, [cat]: false })) }
  }

  const handleCatFileChange = (cat: Category, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCatFiles((p) => ({ ...p, [cat]: file }))
    setCatPreviews((p) => ({ ...p, [cat]: URL.createObjectURL(file) }))
  }

  const counts = {
    total: products.length,
    boots: products.filter((p) => p.category === 'Boots').length,
    jerseys: products.filter((p) => p.category === 'Jerseys').length,
    essentials: products.filter((p) => p.category === 'Essentials').length,
  }

  // ══════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════
  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass-card-strong rounded-2xl p-8 sm:p-10 w-full max-w-sm silver-glow text-center"
        >
          <div className="flex justify-center mb-6">
            <LogoImg size="lg" />
          </div>
          <h1 className="chrome-text text-5xl tracking-[0.15em] mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            ADMIN
          </h1>
          <p className="text-chrome-500 text-xs tracking-[0.25em] mb-8" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            BALLER ZONE DASHBOARD
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4">
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="admin-input text-center tracking-widest"
            />
            <AnimatePresence>
              {wrongPw && (
                <motion.p
                  key={shakeKey}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-red-400 text-sm tracking-widest"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  WRONG PASSWORD
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" className="w-full bg-white text-black font-semibold tracking-[0.2em] text-sm uppercase py-3 rounded-lg hover:bg-chrome-100 transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              ENTER
            </button>
          </form>

          <Link href="/" className="inline-block mt-6 text-chrome-600 text-xs tracking-widest hover:text-chrome-400 transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            ← BACK TO SITE
          </Link>
        </motion.div>
      </main>
    )
  }

  // ══════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      {/* Top Nav */}
      <nav className="glass-card-strong border-b border-white/[0.07] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LogoImg size="sm" />
            <span className="chrome-text text-lg sm:text-xl tracking-widest truncate" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ADMIN PANEL
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-green-400 text-xs tracking-widest border border-green-400/30 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AUTHENTICATED
            </span>
            <Link href="/" className="text-chrome-400 text-xs tracking-widest hover:text-white transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              VIEW SITE
            </Link>
            <button onClick={() => setAuthed(false)} className="text-chrome-500 text-xs tracking-widest hover:text-white transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {[
            { label: 'TOTAL', value: loading ? '…' : counts.total },
            { label: 'BOOTS', value: loading ? '…' : counts.boots },
            { label: 'JERSEYS', value: loading ? '…' : counts.jerseys },
            { label: 'ESSENTIALS', value: loading ? '…' : counts.essentials },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 sm:p-5 text-center">
              <div className="chrome-text text-4xl sm:text-5xl leading-none mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{s.value}</div>
              <div className="text-chrome-600 text-[10px] sm:text-xs tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Firebase badge */}
        <div className="mb-5 sm:mb-6">
          <span className="inline-flex items-center gap-1.5 text-orange-400 text-xs tracking-widest border border-orange-400/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            FIREBASE CONNECTED — LIVE SYNC
          </span>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1">
          {([
            { id: 'upload', label: 'UPLOAD' },
            { id: 'manage', label: 'MANAGE' },
            { id: 'categories', label: 'CATEGORIES' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 sm:px-6 py-2 text-xs sm:text-sm tracking-widest uppercase rounded-full transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.id
                  ? 'bg-white text-black font-semibold'
                  : 'border border-white/20 text-chrome-400 hover:text-white'
              }`}
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ UPLOAD TAB ══ */}
        {activeTab === 'upload' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          >
            {/* Form */}
            <div className="glass-card rounded-2xl p-5 sm:p-8">
              <h2 className="chrome-text text-2xl tracking-widest mb-5 sm:mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                ADD PRODUCT
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-chrome-500 text-xs tracking-widest block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>PRODUCT NAME</label>
                  <input className="admin-input" placeholder="e.g. Phantom Elite FG" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                  <label className="text-chrome-500 text-xs tracking-widest block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>CATEGORY</label>
                  <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)}
                        className={`flex-1 py-2 text-xs sm:text-sm tracking-wider rounded-lg border transition-all ${category === cat ? 'bg-white text-black border-white font-semibold' : 'border-white/15 text-chrome-400 hover:border-white/30'}`}
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-chrome-500 text-xs tracking-widest block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>IMAGE</label>
                  <div className="flex gap-2 mb-3">
                    {(['url', 'file'] as const).map((mode) => (
                      <button key={mode} type="button"
                        onClick={() => { setImageMode(mode); setPreviewSrc(''); setImageUrl(''); setImageFile(null) }}
                        className={`px-3 py-1.5 text-xs tracking-widest rounded-full border transition-all ${imageMode === mode ? 'bg-white text-black border-white' : 'border-white/15 text-chrome-400 hover:border-white/30'}`}
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >{mode === 'url' ? 'URL' : 'FILE → FIREBASE'}</button>
                    ))}
                  </div>
                  {imageMode === 'url' ? (
                    <input className="admin-input" placeholder="https://..." value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setPreviewSrc(e.target.value) }} />
                  ) : (
                    <div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full border border-dashed border-white/20 rounded-lg py-4 text-chrome-400 text-sm tracking-widest hover:border-white/40 hover:text-white transition-all"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >{imageFile ? imageFile.name : '+ SELECT IMAGE'}</button>
                      {uploading && uploadPct > 0 && (
                        <div className="mt-2">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 transition-all" style={{ width: `${uploadPct}%` }} />
                          </div>
                          <p className="text-chrome-500 text-xs mt-1 tracking-widest">UPLOADING {uploadPct}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={uploading || !name || (!imageUrl && !imageFile)}
                  className="w-full bg-white text-black font-semibold tracking-widest text-sm uppercase py-3 rounded-xl hover:bg-chrome-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {uploading ? 'UPLOADING...' : 'ADD PRODUCT'}
                </button>

                <AnimatePresence>
                  {uploadSuccess && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-green-400 text-sm tracking-widest text-center" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >✓ SAVED TO FIRESTORE</motion.p>
                  )}
                  {uploadError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-sm tracking-widest text-center" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >✕ {uploadError}</motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Live preview */}
            <div>
              <h2 className="chrome-text text-2xl tracking-widest mb-5 sm:mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>LIVE PREVIEW</h2>
              <div className="glass-card rounded-xl overflow-hidden max-w-xs">
                <div className="relative aspect-[4/3] bg-chrome-900">
                  {previewSrc
                    ? <Image src={previewSrc} alt="Preview" fill className="object-cover" unoptimized />
                    : <div className="absolute inset-0 flex items-center justify-center text-chrome-700 text-4xl">⚽</div>
                  }
                </div>
                <div className="p-4 space-y-2">
                  <span className={badgeClass(category)}>{category}</span>
                  <p className="text-white text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>{name || 'Product Name'}</p>
                  <div className="wa-btn rounded-lg py-2 text-center text-white text-xs tracking-widest font-semibold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>ORDER ON WHATSAPP</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ MANAGE TAB ══ */}
        {activeTab === 'manage' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <AnimatePresence>
              {deleteError && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
                >
                  <p className="text-red-400 text-sm font-semibold tracking-widest mb-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    ✕ DELETE FAILED
                  </p>
                  <p className="text-red-300/80 text-xs leading-relaxed" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    Firestore rules are blocking writes. Go to{' '}
                    <strong>Firebase Console → Firestore → Rules</strong> and set{' '}
                    <code className="bg-red-900/40 px-1 rounded text-red-200">allow write: if true;</code> for the products collection.
                  </p>
                  <button onClick={() => setDeleteError('')} className="mt-2 text-red-400/60 text-xs hover:text-red-400 transition-colors">DISMISS ✕</button>
                </motion.div>
              )}
            </AnimatePresence>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <p className="text-chrome-500 text-xl tracking-widest animate-pulse" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>LOADING FROM FIRESTORE...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <span className="text-5xl">⚽</span>
                <p className="text-chrome-500 text-lg tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>NO PRODUCTS YET</p>
                <button onClick={() => setActiveTab('upload')} className="text-chrome-400 text-sm tracking-widest underline" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Add your first product</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {products.map((product) => (
                  <ManageCard
                    key={product.id}
                    product={product}
                    confirmDeleteId={confirmDeleteId}
                    badgeClass={badgeClass}
                    onToggle={() => toggleFeatured(product.id)}
                    onAskDelete={() => { setConfirmDeleteId(product.id); setDeleteError('') }}
                    onConfirmDelete={() => handleDelete(product.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ CATEGORIES TAB ══ */}
        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-chrome-500 text-sm tracking-widest mb-6" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Update the hero images shown on the category cards on the homepage.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {CATEGORIES.map((cat) => {
                const currentImg = catPreviews[cat] || categoryImages[cat]
                const fileRef = catFileRefs[cat]
                return (
                  <div key={cat} className="glass-card rounded-2xl overflow-hidden">
                    {/* Current image preview */}
                    <div className="relative aspect-[3/2]">
                      <Image src={currentImg} alt={cat} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <h3 className="absolute bottom-3 left-4 chrome-text text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>{cat}</h3>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* URL input */}
                      <input
                        className="admin-input text-sm"
                        placeholder="Paste new image URL..."
                        value={catUrls[cat]}
                        onChange={(e) => {
                          setCatUrls((p) => ({ ...p, [cat]: e.target.value }))
                          if (e.target.value) setCatPreviews((p) => ({ ...p, [cat]: e.target.value }))
                        }}
                      />

                      {/* Or upload file */}
                      <div>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCatFileChange(cat, e)}
                        />
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-full border border-dashed border-white/15 rounded-lg py-2.5 text-chrome-500 text-xs tracking-widest hover:border-white/30 hover:text-chrome-300 transition-all"
                          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                        >
                          {catFiles[cat] ? catFiles[cat]!.name : '+ UPLOAD FILE → FIREBASE'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleSaveCatImage(cat)}
                        disabled={catSaving[cat]}
                        className="w-full bg-white text-black font-semibold tracking-widest text-xs sm:text-sm uppercase py-2.5 rounded-xl hover:bg-chrome-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        {catSaving[cat] ? 'SAVING...' : `SAVE ${cat.toUpperCase()} IMAGE`}
                      </button>

                      <AnimatePresence>
                        {catSuccess[cat] && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-green-400 text-xs tracking-widest text-center" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                          >✓ UPDATED LIVE</motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}

// ── Extracted product card for manage tab ────────────
interface ManageCardProps {
  product: Product
  confirmDeleteId: string | null
  badgeClass: (cat: Category) => string
  onToggle: () => void
  onAskDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function ManageCard({ product, confirmDeleteId, badgeClass, onToggle, onAskDelete, onConfirmDelete, onCancelDelete }: ManageCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />

        {/* Inline delete confirm overlay */}
        <AnimatePresence>
          {confirmDeleteId === product.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3 p-3"
            >
              <p className="text-white text-xs tracking-widest text-center leading-relaxed" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                DELETE<br />
                <span className="text-chrome-300">&ldquo;{product.name}&rdquo;</span>?
              </p>
              <div className="flex gap-2">
                <button onClick={onConfirmDelete}
                  className="bg-red-500 text-white px-4 py-1.5 text-xs tracking-widest rounded-lg font-semibold hover:bg-red-400 transition-colors"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >YES</button>
                <button onClick={onCancelDelete}
                  className="border border-white/30 text-white px-4 py-1.5 text-xs tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >NO</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info + always-visible action buttons */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <span className={`${badgeClass(product.category)} text-[9px] sm:text-[10px]`}>{product.category}</span>
            <p className="text-white text-xs sm:text-sm mt-1 leading-tight truncate" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
              {product.name}
            </p>
            {product.featured && <span className="text-yellow-400 text-[10px]">★ Featured</span>}
          </div>
          {/* Action buttons — always visible, no hover needed */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onToggle}
              title={product.featured ? 'Unfeature' : 'Feature'}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all ${
                product.featured
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'bg-white/8 text-chrome-500 border border-white/12 hover:text-yellow-400 hover:border-yellow-400/40'
              }`}
            >★</button>
            <button
              onClick={onAskDelete}
              title="Delete"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-xs hover:bg-red-500/30 transition-all"
            >✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}
