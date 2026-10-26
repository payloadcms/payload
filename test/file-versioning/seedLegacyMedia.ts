import type { Payload } from 'payload'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { legacyMediaSlug } from './shared.js'

// 1600 x 1600 PNG
const imageFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads/image.png',
)

/** Focal points of the seeded legacy documents, keyed by each document's `alt`. */
export const legacyFocalPoints = {
  'legacy center': { x: 50, y: 50 },
  'legacy off-center': { x: 30, y: 70 },
}

/** Saves documents the way they looked before `_transforms` existed. */
export async function seedLegacyMedia({ payload }: { payload: Payload }): Promise<void> {
  const bytes = await readFile(imageFixture)

  for (const [alt, focalPoint] of Object.entries(legacyFocalPoints)) {
    const doc = await payload.create({
      collection: legacyMediaSlug,
      data: { alt },
      file: { name: 'legacy.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    // The focal point lived only in focalX/focalY, and `_transforms` stays null.
    await payload.db.updateOne({
      id: doc.id,
      collection: legacyMediaSlug,
      data: { focalX: focalPoint.x, focalY: focalPoint.y },
    })
  }
}
