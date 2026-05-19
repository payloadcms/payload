import type { CollectionSlug, Payload } from 'payload'

import { del, list } from '@vercel/blob'
import { expect } from 'vitest'

export async function clearTestBlobs(): Promise<void> {
  const { blobs } = await list()

  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url))
  }
}

export async function verifyUploads({
  collectionSlug,
  payload,
  prefix = '',
  uploadId,
}: {
  collectionSlug: string
  payload: Payload
  prefix?: string
  uploadId: number | string
}): Promise<void> {
  const uploadData = (await payload.findByID({
    collection: collectionSlug as CollectionSlug,
    id: uploadId,
  })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

  const { blobs } = await list()

  const filenames = Object.values(uploadData.sizes || {}).map((s) => s.filename)
  filenames.push(uploadData.filename)

  for (const fn of filenames) {
    if (!fn) {
      continue
    }
    const pathname = prefix ? `${prefix}/${fn}` : fn
    const found = blobs.some((b) => b.pathname === pathname)
    expect(found, `Expected blob "${pathname}" to exist in storage`).toBe(true)
  }
}
