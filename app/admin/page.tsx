'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { startUpload } from '@/lib/firebaseUpload'
import { useProductStore, Product } from '@/lib/store'
import UploadZone from '@/components/UploadZone'

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'madballers2024'
const MAX_EXTRAS = 5

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'upload' | 'manage' | 'categories'

interface ExtraImage {
  id: number
  url: string   // empty until upload completes
  busy: boolean
}

interface Toast {
  id: number
  type: 'ok' | 'err'
  msg: string
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function LogoImg({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-20 h-20' : 'w-9 h-9'
  return (
    <div
      className={`relative ${cls} rounded-full overflow-hidden flex-shrink-0 ${
        size === 'lg' ? 'animate-glow-pulse border border-white/10' : ''
      }`}
    >
      <Image src="/logo.png" alt="MAD BALLERS" fill className="object-contain" />
    </div>
  )
}

// ── Toast container ────────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className={`
              pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3
              border shadow-xl backdrop-blur-sm
              ${t.type === 'ok'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'}
            `}
          >
            <span className="text-base">{t.type === 'ok' ? '✓' : '✕'}</span>
            <span
              className="text-xs tracking-widest leading-snug max-w-[220px]"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {t.msg}
            </span>
            <button
              onClick={() => onDismiss(t.id)}
              className="opacity-40 hover:opacity-80 transition-opacity text-xs ml-1"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Admin page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {

  // ── Auth ───────────────────────────────────────────────────────
  const [authed, setAuthed]     = useState(false)
  const [password, setPassword] = useState('')
  const [wrongPw, setWrongPw]   = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  // ── Navigation ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  // ── Toast notifications ─────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const addToast = useCallback((type: 'ok' | 'err', msg: string) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, type, msg }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Upload form ────────────────────────────────────────────────
  // Incrementing formKey fully unmounts/remounts all UploadZone instances → clean reset
  const [formKey,     setFormKey]     = useState(0)
  const [mainUrl,     setMainUrl]     = useState('')     // Firebase URL (set when upload done)
  const [mainPreview, setMainPreview] = useState('')     // blob URL for live preview panel
  const [mainBusy,    setMainBusy]    = useState(false)
  const [extras,      setExtras]      = useState<ExtraImage[]>([])
  const nextId = useRef(0)
  const [saving,      setSaving]      = useState(false)

  // ── Manage tab ─────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Categories tab ─────────────────────────────────────────────
  const [catUrl,      setCatUrl]      = useState('')
  const [catFile,     setCatFile]     = useState<File | null>(null)
  const [catPreview,  setCatPreview]  = useState('')
  const [catSaving,   setCatSaving]   = useState(false)
  const catFileRef = useRef<HTMLInputElement>(null)

  const {
    products, loading,
    categoryImages, addProduct, removeProduct, updateCategoryImage,
  } = useProductStore()

  // ── Auth ───────────────────────────────────────────────────────

  const handleLogin = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setWrongPw(false)
    } else {
      setWrongPw(true)
      setShakeKey((k) => k + 1)
      setPassword('')
    }
  }, [password])

  // ── Extra image helpers ────────────────────────────────────────

  const updateExtraUrl = useCallback((id: number, url: string) => {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, url } : e)))
  }, [])

  const updateExtraBusy = useCallback((id: number, busy: boolean) => {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, busy } : e)))
  }, [])

  const handleExtraError = useCallback((msg: string) => {
    addToast('err', msg)
  }, [addToast])

  const removeExtra = useCallback((id: number) => {
    setExtras((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addExtra = useCallback(() => {
    setExtras((prev) => [
      ...prev,
      { id: nextId.current++, url: '', busy: false },
    ])
  }, [])

  // ── Submit gate ────────────────────────────────────────────────

  const anyBusy = useMemo(
    () => mainBusy || extras.some((e) => e.busy),
    [mainBusy, extras],
  )

  const canSubmit = useMemo(
    () => !!mainUrl && !anyBusy && !saving,
    [mainUrl, anyBusy, saving],
  )

  const submitLabel = useMemo(() => {
    if (saving)   return 'SAVING TO FIRESTORE...'
    if (anyBusy)  return 'UPLOADING...'
    if (!mainUrl) return 'SELECT AN IMAGE FIRST'
    return 'ADD PRODUCT ✓'
  }, [saving, anyBusy, mainUrl])

  // ── Submit ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const extraUrls = extras.map((e) => e.url).filter(Boolean)
      await addProduct({
        name: '',
        category: 'Boots',
        imageUrl: mainUrl,
        ...(extraUrls.length > 0 && { images: extraUrls }),
      })
      // Reset form — incrementing formKey unmounts all UploadZone instances
      setMainUrl('')
      setMainPreview('')
      setMainBusy(false)
      setExtras([])
      setFormKey((k) => k + 1)
      addToast('ok', 'PRODUCT SAVED TO FIRESTORE ✓')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast('err', `Save failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }, [canSubmit, mainUrl, extras, addProduct, addToast])

  // ── Delete ─────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeProduct(id)
      setConfirmDeleteId(null)
      addToast('ok', 'PRODUCT DELETED')
    } catch (err) {
      console.error('Delete error:', err)
      setConfirmDeleteId(null)
      addToast('err', 'Delete failed — check Firestore rules (allow write: if true)')
    }
  }, [removeProduct, addToast])

  // ── Category image save ────────────────────────────────────────

  const handleSaveCatImage = useCallback(async () => {
    setCatSaving(true)
    try {
      let url = catUrl.trim() || categoryImages['Boots']
      if (catFile) {
        const { promise } = startUpload(catFile, 'categories', () => {})
        url = await promise
        setCatPreview(url)
        setCatFile(null)
        if (catFileRef.current) catFileRef.current.value = ''
      }
      await updateCategoryImage('Boots', url)
      addToast('ok', 'BOOTS IMAGE UPDATED ✓')
    } catch (err) {
      console.error('Category save failed:', err)
      addToast('err', 'Failed to save category image')
    } finally {
      setCatSaving(false)
    }
  }, [catUrl, catFile, categoryImages, updateCategoryImage, addToast])

  const handleCatFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCatFile(file)
    setCatPreview(URL.createObjectURL(file))
  }, [])

  // ── Main upload error handler ──────────────────────────────────
  const handleMainError = useCallback((msg: string) => {
    addToast('err', msg)
  }, [addToast])

  // ════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════

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
          <h1
            className="chrome-text text-5xl tracking-[0.15em] mb-1"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            ADMIN
          </h1>
          <p
            className="text-chrome-500 text-xs tracking-[0.25em] mb-8"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            BALLER ZONE DASHBOARD
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleLogin() }}
            className="space-y-4"
          >
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
            <button
              type="submit"
              className="w-full bg-white text-black font-semibold tracking-[0.2em] text-sm uppercase py-3 rounded-lg hover:bg-chrome-100 transition-colors"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              ENTER
            </button>
          </form>

          <Link
            href="/"
            className="inline-block mt-6 text-chrome-600 text-xs tracking-widest hover:text-chrome-400 transition-colors"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            ← BACK TO SITE
          </Link>
        </motion.div>
      </main>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════════════

  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      {/* Global toast notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* ── Top nav ── */}
      <nav className="glass-card-strong border-b border-white/[0.07] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LogoImg size="sm" />
            <span
              className="chrome-text text-lg sm:text-xl tracking-widest truncate"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              ADMIN PANEL
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-green-400 text-xs tracking-widest border border-green-400/30 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AUTHENTICATED
            </span>
            <Link
              href="/"
              className="text-chrome-400 text-xs tracking-widest hover:text-white transition-colors"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              VIEW SITE
            </Link>
            <button
              onClick={() => setAuthed(false)}
              className="text-chrome-500 text-xs tracking-widest hover:text-white transition-colors"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Stats */}
        <div className="mb-6 sm:mb-10 max-w-[140px]">
          <div className="glass-card rounded-xl p-4 sm:p-5 text-center">
            <div
              className="chrome-text text-4xl sm:text-5xl leading-none mb-1"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              {loading ? '…' : products.length}
            </div>
            <div
              className="text-chrome-600 text-[10px] sm:text-xs tracking-widest"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              TOTAL PAIRS
            </div>
          </div>
        </div>

        {/* Firebase badge */}
        <div className="mb-5 sm:mb-6">
          <span className="inline-flex items-center gap-1.5 text-orange-400 text-xs tracking-widest border border-orange-400/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            FIREBASE CONNECTED — LIVE SYNC
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1">
          {(
            [
              { id: 'upload',     label: 'UPLOAD'     },
              { id: 'manage',     label: 'MANAGE'     },
              { id: 'categories', label: 'CATEGORIES' },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
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

        {/* ══════════════ UPLOAD TAB ══════════════ */}
        {activeTab === 'upload' && (
          <motion.div
            key={`upload-tab-${formKey}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          >
            {/* ── Left: Form ── */}
            <div className="glass-card rounded-2xl p-5 sm:p-8 space-y-5">
              <h2
                className="chrome-text text-2xl tracking-widest"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                ADD BOOTS
              </h2>

              {/* Main image zone */}
              <div>
                <label
                  className="text-chrome-500 text-xs tracking-widest block mb-2"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  MAIN IMAGE
                </label>
                <UploadZone
                  key={`main-${formKey}`}
                  folder="products"
                  label="+ SELECT IMAGE"
                  sublabel="drag & drop or tap to browse"
                  onUploaded={setMainUrl}
                  onPreview={setMainPreview}
                  onBusyChange={setMainBusy}
                  onError={handleMainError}
                />
              </div>

              {/* Additional images */}
              <div>
                <label
                  className="text-chrome-500 text-xs tracking-widest block mb-2"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  ADDITIONAL IMAGES{' '}
                  <span className="text-chrome-700">(optional — up to {MAX_EXTRAS})</span>
                </label>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {extras.map((extra, idx) => (
                      <motion.div
                        key={extra.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2"
                      >
                        <div className="flex-1">
                          <UploadZone
                            compact
                            folder="products"
                            label={`+ PHOTO ${idx + 2}`}
                            onUploaded={(url) => updateExtraUrl(extra.id, url)}
                            onBusyChange={(busy) => updateExtraBusy(extra.id, busy)}
                            onError={handleExtraError}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtra(extra.id)}
                          disabled={extra.busy}
                          className="w-9 h-9 rounded-lg border border-red-500/20 text-red-400 flex-shrink-0 flex items-center justify-center text-sm hover:bg-red-500/10 transition-colors disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {extras.length < MAX_EXTRAS && (
                    <button
                      type="button"
                      onClick={addExtra}
                      className="w-full border border-dashed border-white/15 rounded-lg py-2 text-chrome-500 text-xs tracking-widest hover:border-white/30 hover:text-chrome-300 transition-all"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      + ADD ANOTHER PHOTO
                    </button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-white text-black font-semibold tracking-widest text-sm uppercase py-3 rounded-xl hover:bg-chrome-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {submitLabel}
              </button>
            </div>

            {/* ── Right: Live preview ── */}
            <div>
              <h2
                className="chrome-text text-2xl tracking-widest mb-5 sm:mb-6"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                LIVE PREVIEW
              </h2>
              <div className="glass-card rounded-xl overflow-hidden max-w-xs">
                <div className="relative aspect-square bg-[#111]">
                  <AnimatePresence mode="wait">
                    {mainPreview ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainPreview}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center text-chrome-700 text-4xl"
                      >
                        👟
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="p-4 space-y-2">
                  <span className="badge-boots">Boots</span>
                  <div
                    className="wa-btn rounded-lg py-2 text-center text-white text-xs tracking-widest font-semibold"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    ORDER NOW
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════ MANAGE TAB ══════════════ */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <p
                  className="text-chrome-500 text-xl tracking-widest animate-pulse"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  LOADING FROM FIRESTORE...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <span className="text-5xl">👟</span>
                <p
                  className="text-chrome-500 text-lg tracking-widest"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  NO PRODUCTS YET
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-chrome-400 text-sm tracking-widest underline"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {products.map((product) => (
                  <ManageCard
                    key={product.id}
                    product={product}
                    confirmDeleteId={confirmDeleteId}
                    onAskDelete={() => setConfirmDeleteId(product.id)}
                    onConfirmDelete={() => handleDelete(product.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ CATEGORIES TAB ══════════════ */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p
              className="text-chrome-500 text-sm tracking-widest mb-6"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Update the hero image shown on the Boots section of the homepage.
            </p>
            <div className="max-w-sm">
              <div className="glass-card rounded-2xl overflow-hidden">
                {/* Current image preview */}
                <div className="relative aspect-[3/2]">
                  <Image
                    src={catPreview || categoryImages['Boots']}
                    alt="Boots"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <h3
                    className="absolute bottom-3 left-4 chrome-text text-2xl"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
                  >
                    BOOTS
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <input
                    className="admin-input text-sm"
                    placeholder="Paste new image URL..."
                    value={catUrl}
                    onChange={(e) => {
                      setCatUrl(e.target.value)
                      if (e.target.value) setCatPreview(e.target.value)
                    }}
                  />

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
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}

// ── ManageCard ─────────────────────────────────────────────────────────────────

interface ManageCardProps {
  product: Product
  confirmDeleteId: string | null
  onAskDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function ManageCard({
  product, confirmDeleteId,
  onAskDelete, onConfirmDelete, onCancelDelete,
}: ManageCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          unoptimized
        />

        <AnimatePresence>
          {confirmDeleteId === product.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3 p-3"
            >
              <p
                className="text-white text-xs tracking-widest text-center leading-relaxed"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                DELETE THIS BOOT?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onConfirmDelete}
                  className="bg-red-500 text-white px-4 py-1.5 text-xs tracking-widest rounded-lg font-semibold hover:bg-red-400 transition-colors"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  YES
                </button>
                <button
                  onClick={onCancelDelete}
                  className="border border-white/30 text-white px-4 py-1.5 text-xs tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  NO
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-1.5">
        <span className="badge-boots text-[9px] sm:text-[10px]">Boots</span>
        <button
          onClick={onAskDelete}
          title="Delete"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-xs hover:bg-red-500/30 transition-all flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
