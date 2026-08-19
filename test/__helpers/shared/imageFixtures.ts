import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * A checked-in 44-frame animated WEBP (200x200 per frame) — Sharp can't
 * synthesize multi-page images, so tests needing one must read a real file.
 */
export const animatedWebpFixturePath = resolve(here, '../../uploads/animated.webp')

export async function makeImageBuffer({
  background = { b: 0, g: 128, r: 255 },
  format = 'png',
  height,
  width,
}: {
  background?: { b: number; g: number; r: number }
  format?: 'gif' | 'png' | 'webp'
  height: number
  width: number
}): Promise<Buffer> {
  return sharp({ create: { background, channels: 3, height, width } })
    .toFormat(format)
    .toBuffer()
}

/**
 * A two-colour image split along `splitAxis` (red/blue halves) — lets a test
 * prove a focal-point extract region lands where the math says, not just that
 * the output dimensions are right.
 */
export async function makeTwoColorImage({
  height,
  splitAxis,
  width,
}: {
  height: number
  splitAxis: 'x' | 'y'
  width: number
}): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 3)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const isFirstHalf = splitAxis === 'x' ? x < width / 2 : y < height / 2

      if (isFirstHalf) {
        raw[idx] = 255 // red
      } else {
        raw[idx + 2] = 255 // blue
      }
    }
  }

  return sharp(raw, { raw: { channels: 3, height, width } })
    .png()
    .toBuffer()
}

export function sampleRawPixel({
  data,
  info,
  x,
  y,
}: {
  data: Buffer
  info: { channels: number; width: number }
  x: number
  y: number
}): { b: number; g: number; r: number } {
  const idx = (y * info.width + x) * info.channels
  return { b: data[idx + 2]!, g: data[idx + 1]!, r: data[idx]! }
}
