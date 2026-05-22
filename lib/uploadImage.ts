/**
 * Upload a file to Cloudinary and return its secure URL.
 *
 * Uses the unsigned upload API — no SDK, just fetch + FormData.
 * Configure in .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
 */
export async function uploadImage(file: File | Blob, folder = 'products'): Promise<string> {
  const cloud  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloud || !preset) {
    throw new Error(
      'Cloudinary not configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and ' +
      'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local'
    )
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', preset)
  form.append('folder', folder)

  const name = file instanceof File ? file.name : 'cropped.jpg'
  console.log('[uploadImage] uploading to Cloudinary —', name, `(${(file.size / 1024).toFixed(0)} KB)`, 'folder:', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    { method: 'POST', body: form }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`)
  }

  const data = await res.json()
  console.log('[uploadImage] done:', data.secure_url)
  return data.secure_url as string
}
