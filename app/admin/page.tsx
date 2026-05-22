'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useProductStore, Product } from '@/lib/store'
import CropModal from '@/components/CropModal'

const ADMIN_PASSWORD = 'madballers2024'

type Tab = 'upload' | 'manage' | 'categories'

// ── Compress image before upload (canvas resize → JPEG 75%) ──
function compressImage(file: File, maxPx = 1200): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx }
        else { width = Math.round((width / height) * maxPx); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file),
        'image/jpeg', 0.75
      )
    }
    img.onerror = () => resolve(file) // fallback: use original
    img.src = url
  })
}

// ── Upload to Firebase Storage ───────────────────────
async function uploadToCloudinary(file: File, onProgress: (n: number) => void): Promise<string> {
  const compressed = await compressImage(file)
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `products/${Date.now()}_${compressed.name}`)
    const task = uploadBytesResumable(storageRef, compressed)
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
  const [imageMode, setImageMode] = useState<'url' | 'file'>('file')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([])
  const [additionalFiles, setAdditionalFiles] = useState<(File | null)[]>([])
  const [additionalFilePreviews, setAdditionalFilePreviews] = useState<string[]>([])
  const additionalFileRefs = useRef<(HTMLInputElement | null)[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Crop modal ────────────────────────────────────
  const [cropSrc,  setCropSrc]  = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  // 'main' for main image, number for additional image index
  const [cropTarget, setCropTarget] = useState<'main' | number>('main')

  // ── Manage products ───────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  // ── Category images (Boots only) ─────────────────
  const [catUrl, setCatUrl] = useState('')
  const [catFile, setCatFile] = useState<File | null>(null)
  const [catPreview, setCatPreview] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catSuccess, setCatSuccess] = useState(false)
  const catFileRef = useRef<HTMLInputElement>(null)

  const { products, loading, categoryImages, addProduct, removeProduct, updateCategoryImage } = useProductStore()

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setWrongPw(false) }
    else { setWrongPw(true); setShakeKey((k) => k + 1); setPassword('') }
  }

  // ── Product upload ────────────────────────────────
  const openCrop = (file: File, target: 'main' | number) => {
    setCropFile(file)
    setCropSrc(URL.createObjectURL(file))
    setCropTarget(target)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    openCrop(file, 'main')
  }

  const handleCropConfirm = (croppedFile: File, preview: string) => {
    if (cropTarget === 'main') {
      setImageFile(croppedFile)
      setPreviewSrc(preview)
    } else {
      const idx = cropTarget as number
      setAdditionalFiles((p) => p.map((f, i) => (i === idx ? croppedFile : f)))
      setAdditionalFilePreviews((p) => p.map((s, i) => (i === idx ? preview : s)))
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null); setCropFile(null)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null); setCropFile(null)
    // Reset the relevant file input so user can re-pick
    if (cropTarget === 'main' && fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl && !imageFile) return
    setUploading(true); setUploadError('')
    try {
      let finalUrl = imageUrl
      if (imageMode === 'file' && imageFile) finalUrl = await uploadToCloudinary(imageFile, setUploadPct)
      const extraImages: string[] = []
      if (imageMode === 'url') {
        extraImages.push(...additionalUrls.map((u) => u.trim()).filter(Boolean))
      } else {
        for (const f of additionalFiles) {
          if (f) extraImages.push(await uploadToCloudinary(f, () => {}))
        }
      }
      await addProduct({
        name: '',
        category: 'Boots',
        imageUrl: finalUrl,
        ...(extraImages.length > 0 && { images: extraImages }),
      })
      setImageUrl(''); setImageFile(null); setPreviewSrc(''); setUploadPct(0)
      setAdditionalUrls([]); setAdditionalFiles([]); setAdditionalFilePreviews([])
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(`Upload failed: ${msg}`)
    }
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
  const handleSaveCatImage = async () => {
    setCatSaving(true)
    try {
      let url = catUrl || categoryImages['Boots']
      if (catFile) {
        url = await uploadToCloudinary(catFile, () => {})
        setCatPreview(url)
        setCatFile(null)
      }
      await updateCategoryImage('Boots', url)
      setCatSuccess(true)
      setTimeout(() => setCatSuccess(false), 3000)
    } catch { /* silent */ }
    finally { setCatSaving(false) }
  }

  const handleCatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCatFile(file)
    setCatPreview(URL.createObjectURL(file))
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

      {/* ── Crop Modal ── */}
      {cropSrc && cropFile && (
        <CropModal
          src={cropSrc}
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

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
        <div className="mb-6 sm:mb-10 max-w-[140px]">
          <div className="glass-card rounded-xl p-4 sm:p-5 text-center">
            <div className="chrome-text text-4xl sm:text-5xl leading-none mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{loading ? '…' : products.length}</div>
            <div className="text-chrome-600 text-[10px] sm:text-xs tracking-widest" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>TOTAL PAIRS</div>
          </div>
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
                ADD BOOTS
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-chrome-500 text-xs tracking-widest block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>IMAGE</label>
                  <div className="flex gap-2 mb-3">
                    {(['file', 'url'] as const).map((mode) => (
                      <button key={mode} type="button"
                        onClick={() => { setImageMode(mode); setPreviewSrc(''); setImageUrl(''); setImageFile(null); setAdditionalUrls([]); setAdditionalFiles([]); setAdditionalFilePreviews([]); setUploadError('') }}
                        className={`px-3 py-1.5 text-xs tracking-widest rounded-full border transition-all ${imageMode === mode ? 'bg-white text-black border-white' : 'border-white/15 text-chrome-400 hover:border-white/30'}`}
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >{mode === 'url' ? 'URL' : 'FILE → FIREBASE ★'}</button>
                    ))}
                  </div>
                  {imageMode === 'url' && (
                    <p className="text-yellow-500/80 text-[10px] tracking-widest mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      ⚠ WhatsApp image URLs expire — use FILE → FIREBASE instead
                    </p>
                  )}
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

                {/* Additional images — matches main image mode */}
                <div>
                  <label className="text-chrome-500 text-xs tracking-widest block mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    ADDITIONAL IMAGES <span className="text-chrome-700">(optional — up to 5)</span>
                  </label>
                  <div className="space-y-2">
                    {imageMode === 'url'
                      ? additionalUrls.map((url, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              className="admin-input flex-1 text-sm"
                              placeholder={`Photo ${i + 2} URL...`}
                              value={url}
                              onChange={(e) => setAdditionalUrls((p) => p.map((u, j) => j === i ? e.target.value : u))}
                            />
                            <button
                              type="button"
                              onClick={() => setAdditionalUrls((p) => p.filter((_, j) => j !== i))}
                              className="w-9 h-9 rounded-lg border border-red-500/20 text-red-400 flex items-center justify-center text-sm hover:bg-red-500/10 transition-colors flex-shrink-0"
                            >✕</button>
                          </div>
                        ))
                      : additionalFiles.map((file, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              ref={(el) => { additionalFileRefs.current[i] = el }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                openCrop(f, i)
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => additionalFileRefs.current[i]?.click()}
                              className="flex-1 border border-dashed border-white/20 rounded-lg py-2.5 text-chrome-400 text-xs tracking-widest hover:border-white/40 hover:text-white transition-all truncate px-3"
                              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                            >
                              {file ? file.name : `+ PHOTO ${i + 2}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdditionalFiles((p) => p.filter((_, j) => j !== i))
                                setAdditionalFilePreviews((p) => p.filter((_, j) => j !== i))
                                additionalFileRefs.current = additionalFileRefs.current.filter((_, j) => j !== i)
                              }}
                              className="w-9 h-9 rounded-lg border border-red-500/20 text-red-400 flex items-center justify-center text-sm hover:bg-red-500/10 transition-colors flex-shrink-0"
                            >✕</button>
                          </div>
                        ))
                    }
                    {(imageMode === 'url' ? additionalUrls : additionalFiles).length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (imageMode === 'url') setAdditionalUrls((p) => [...p, ''])
                          else { setAdditionalFiles((p) => [...p, null]); setAdditionalFilePreviews((p) => [...p, '']) }
                        }}
                        className="w-full border border-dashed border-white/15 rounded-lg py-2 text-chrome-500 text-xs tracking-widest hover:border-white/30 hover:text-chrome-300 transition-all"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >+ ADD ANOTHER PHOTO</button>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={uploading || (!imageUrl && !imageFile)}
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
                      className="text-red-400 text-xs tracking-widest text-center" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >✕ {uploadError}</motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Live preview */}
            <div>
              <h2 className="chrome-text text-2xl tracking-widest mb-5 sm:mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>LIVE PREVIEW</h2>
              <div className="glass-card rounded-xl overflow-hidden max-w-xs">
                <div className="relative aspect-square bg-[#111]">
                  {previewSrc
                    ? <Image src={previewSrc} alt="Preview" fill className="object-contain" unoptimized />
                    : <div className="absolute inset-0 flex items-center justify-center text-chrome-700 text-4xl">👟</div>
                  }
                </div>
                <div className="p-4 space-y-2">
                  <span className="badge-boots">Boots</span>
                  <div className="wa-btn rounded-lg py-2 text-center text-white text-xs tracking-widest font-semibold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>ORDER NOW</div>
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
                <span className="text-5xl">👟</span>
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
              Update the hero image shown on the Boots section of the homepage.
            </p>
            <div className="max-w-sm">
              <div className="glass-card rounded-2xl overflow-hidden">
                {/* Current image preview */}
                <div className="relative aspect-[3/2]">
                  <Image src={catPreview || categoryImages['Boots']} alt="Boots" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 chrome-text text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>BOOTS</h3>
                </div>

                <div className="p-4 space-y-3">
                  {/* URL input */}
                  <input
                    className="admin-input text-sm"
                    placeholder="Paste new image URL..."
                    value={catUrl}
                    onChange={(e) => {
                      setCatUrl(e.target.value)
                      if (e.target.value) setCatPreview(e.target.value)
                    }}
                  />

                  {/* Or upload file */}
                  <div>
                    <input
                      ref={catFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCatFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => catFileRef.current?.click()}
                      className="w-full border border-dashed border-white/15 rounded-lg py-2.5 text-chrome-500 text-xs tracking-widest hover:border-white/30 hover:text-chrome-300 transition-all"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {catFile ? catFile.name : '+ UPLOAD FILE → FIREBASE'}
                    </button>
                  </div>

                  <button
                    onClick={handleSaveCatImage}
                    disabled={catSaving}
                    className="w-full bg-white text-black font-semibold tracking-widest text-xs sm:text-sm uppercase py-2.5 rounded-xl hover:bg-chrome-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    {catSaving ? 'SAVING...' : 'SAVE BOOTS IMAGE'}
                  </button>

                  <AnimatePresence>
                    {catSuccess && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-green-400 text-xs tracking-widest text-center" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >✓ UPDATED LIVE</motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
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
  onAskDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function ManageCard({ product, confirmDeleteId, onAskDelete, onConfirmDelete, onCancelDelete }: ManageCardProps) {
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
                DELETE THIS BOOT?
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

      {/* Info + delete button */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <span className="badge-boots text-[9px] sm:text-[10px]">Boots</span>
            <p className="text-white text-xs sm:text-sm mt-1 leading-tight truncate" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
              {product.name}
            </p>
          </div>
          <button
            onClick={onAskDelete}
            title="Delete"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-xs hover:bg-red-500/30 transition-all flex-shrink-0"
          >✕</button>
        </div>
      </div>
    </div>
  )
}
