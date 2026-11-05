import type { CollectionSlug, Payload } from 'payload'

import { del, list } from '@vercel/blob'
import path from 'node:path'
import { expect } from 'vitest'

import { getStoredUploadKeys } from '../__helpers/int/storedUploadKeys.js'

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
  const uploadData = (await payload.db.findOne({
    collection: collectionSlug as CollectionSlug,
    where: { id: { equals: uploadId } },
  })) as unknown as {
    filename: string
    original?: { filename?: string }
    variants: Record<string, { filename: string }>
  }

  const { blobs } = await list()

  const fileKeys = getStoredUploadKeys({ collectionSlug, doc: uploadData, payload })
  const filenames = [
    uploadData.filename,
    uploadData.original?.filename,
    ...Object.values(uploadData.variants || {}).map(({ filename }) => filename),
  ].filter((filename): filename is string => Boolean(filename))

  expect(fileKeys.length).toBeGreaterThan(0)
  for (const filename of filenames) {
    expect(fileKeys.some((key) => path.posix.basename(key) === filename)).toBe(true)
  }

  for (const key of fileKeys) {
    if (prefix) {
      expect(key.startsWith(`${prefix}/`)).toBe(true)
    }
    expect(
      blobs.some((blob) => blob.pathname === key),
      `Expected blob "${key}" in storage`,
    ).toBe(true)
  }
}
