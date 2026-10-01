import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createPayloadRequest } from 'payload'
import sharp from 'sharp'
import { expect, vi } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { controls, mediaSlug, outerRequests, storedFiles } from './shared.js'

const tempDirectories: string[] = []

test.suite('cloud storage bulk request isolation', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    delete controls.onMetadataUpdate
    delete controls.onOuterUpdate
    outerRequests.length = 0
    storedFiles.clear()
    vi.unstubAllGlobals()
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
    )
  })

  for (const mode of ['reprocess', 'buffer', 'temp'] as const) {
    const hasSharedFile = mode !== 'reprocess'
    test(`should preserve isolated crop state for bulk uploads (${mode})`, async ({ payload }) => {
      const docs = await Promise.all(
        ['#336699', '#996633'].map(async (background, index) => {
          const bytes = await sharp({
            create: { background, channels: 3, height: 80 + index * 20, width: 120 + index * 20 },
          })
            .png()
            .toBuffer()
          return payload.create({
            collection: mediaSlug,
            data: {},
            file: {
              data: bytes,
              mimetype: 'image/png',
              name: `original-${index}.png`,
              size: bytes.length,
            },
          })
        }),
      )
      outerRequests.length = 0

      const req = await createPayloadRequest({ payload })
      const uploadEdits = {
        crop: { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 },
        heightInPixels: 40,
        widthInPixels: 60,
      }
      req.query = { uploadEdits }
      let tempFilePath: string | undefined
      if (hasSharedFile) {
        const bytes = await sharp({
          create: { background: '#335599', channels: 3, height: 80, width: 120 },
        })
          .png()
          .toBuffer()
        if (mode === 'temp') {
          const directory = await mkdtemp(path.join(tmpdir(), 'payload-bulk-state-'))
          tempDirectories.push(directory)
          tempFilePath = path.join(directory, 'shared.png')
          await writeFile(tempFilePath, bytes)
        }
        req.file = {
          data: tempFilePath ? Buffer.alloc(0) : bytes,
          tempFilePath,
          mimetype: 'image/png',
          name: 'replacement.png',
          size: bytes.length,
        }
      } else {
        vi.stubGlobal('fetch', (url: string) => {
          const bytes = storedFiles.get(
            decodeURIComponent(new URL(url).pathname.split('/').pop()!),
          )!
          return Promise.resolve(
            new Response(bytes, {
              headers: { 'content-type': 'image/png', 'content-length': String(bytes.length) },
            }),
          )
        })
      }

      let enterMetadata!: () => void
      let releaseMetadata!: () => void
      const entered = new Promise<void>((resolve) => {
        enterMetadata = resolve
      })
      const pending = new Promise<void>((resolve) => {
        releaseMetadata = resolve
      })
      controls.onMetadataUpdate = async () => {
        enterMetadata()
        await pending
      }

      const update = payload.update({
        collection: mediaSlug,
        data: {},
        file: req.file,
        where: { id: { in: docs.map(({ id }) => id) } },
        req,
      })
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          entered,
          update.then((result) => {
            throw new Error(
              `Bulk update finished without metadata: ${JSON.stringify(result.errors)}`,
            )
          }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error('Metadata update was not reached')), 2000)
          }),
        ])
        clearTimeout(timeout)
        expect(req.query.uploadEdits).toBe(uploadEdits)
        expect(req.context).not.toHaveProperty('skipCloudStorage')
      } finally {
        clearTimeout(timeout)
        releaseMetadata()
        await update
      }
      const result = await update

      expect(outerRequests).toHaveLength(2)
      expect(outerRequests[0]!.context).not.toBe(outerRequests[1]!.context)
      expect(outerRequests[0]!.query).not.toBe(outerRequests[1]!.query)
      expect(outerRequests.every(({ query }) => query?.uploadEdits === uploadEdits)).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.docs).toHaveLength(2)
      const hasTempFile = tempFilePath
        ? await stat(tempFilePath).then(
            () => true,
            () => false,
          )
        : false
      expect(hasTempFile).toBe(false)
      expect(
        storedFiles
          .get(result.docs[0]!.filename)!
          .equals(storedFiles.get(result.docs[1]!.filename)!),
      ).toBe(hasSharedFile)
      for (const doc of result.docs) {
        const bytes = storedFiles.get(doc.filename)!
        expect(await sharp(bytes).metadata()).toMatchObject({ height: 40, width: 60 })
        expect(doc.filesize).toBe(bytes.length)
        expect(doc.storageVersion).toBe(2)
      }
    })
  }
})
