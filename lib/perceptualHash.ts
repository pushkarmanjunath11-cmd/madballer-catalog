/**
 * Average-hash (aHash) perceptual image fingerprinting.
 *
 * Algorithm:
 *   1. Draw the image into an 8×8 canvas (64 pixels)
 *   2. Convert each pixel to grayscale
 *   3. Compute the mean of all 64 grayscale values
 *   4. Each bit of the hash = 1 if pixel ≥ mean, else 0
 *
 * Result: a 64-character binary string.
 *
 * Comparison: use hammingDistance(). A distance of ≤ 10 means visually similar.
 */

const HASH_SIZE = 8   // 8×8 = 64 bits

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load for hashing'))
    img.src = src
  })
}

function hashFromElement(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width  = HASH_SIZE
  canvas.height = HASH_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, HASH_SIZE, HASH_SIZE)

  const { data } = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE)
  const n = HASH_SIZE * HASH_SIZE

  // Grayscale (luminance)
  const gray: number[] = []
  for (let i = 0; i < n; i++) {
    gray.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2])
  }

  const mean = gray.reduce((s, v) => s + v, 0) / n
  return gray.map(v => (v >= mean ? '1' : '0')).join('')
}

/** Compute a perceptual hash from a Blob (e.g. cropped JPEG from canvas). */
export async function computeImageHash(blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImg(url)
    return hashFromElement(img)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Hamming distance between two hash strings.
 * Returns the number of bit positions that differ.
 * ≤ 10 out of 64 → visually similar.
 */
export function hammingDistance(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  let d = 0
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) d++
  return d
}

export const DUPLICATE_THRESHOLD = 10   // out of 64 bits
