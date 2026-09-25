import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * A checked-in 44-frame animated WEBP (200x200 per frame) — Sharp can't
 * synthesize multi-page images, so tests needing one must read a real file.
 */
export const animatedWebpFixturePath = resolve(here, '../../uploads/animated.webp')
