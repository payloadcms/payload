import type { UploadInstructions } from 'payload'

import { del, head, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import path from 'path'
import * as qs from 'qs-esm'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

const uploadInstructionsPath = '/upload-instructions'

type VercelBlobUploadInstructions = {
  data: {
    pathname: string
    token: string
  }
  file: UploadInstructions['file']
  name: 'uploadToVercelBlob'
  type: 'dispatch'
}

const uploadMetadata = (collectionSlug?: string, filesize = 1) => ({
  collectionSlug,
  filename: 'image.png',
  filesize,
  mimeType: 'image/png',
})

test.suite('@payloadcms/storage-vercel-blob clientUploads', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    const { blobs } = await list()
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  test('should upload a file via client upload flow', async ({ restClient }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
    })

    expect(instructionsResponse.status).toBe(200)

    const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions
    expect(instructions.type).toBe('dispatch')
    expect(instructions.name).toBe('uploadToVercelBlob')
    expect(instructions.file).toMatchObject({
      mimeType: 'image/png',
      size: file.length,
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: '',
        signedReceipt: expect.any(String),
      },
    })
    expect(instructions.file.filename).toBe('image.png')
    expect(instructions.data.pathname).toBe(
      `${(instructions.file.uploadReference as { _objectKey: string })._objectKey}/${instructions.file.filename}`,
    )

    const result = await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(instructions.file.filename)

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === instructions.data.pathname)
    expect(uploaded).toBeDefined()
  })

  test('should retain random suffixes for Local API uploads when client uploads are enabled', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
      overrideAccess: true,
    })
    const { blobs } = await list()

    expect(doc.filename).toMatch(/^image-[a-z0-9]+\.png$/)
    expect(blobs.map((blob) => blob.pathname)).toContain(`${prefix}/${doc.filename}`)
  })

  test('should retain random suffixes for REST multipart uploads when client uploads are enabled', async ({
    restClient,
  }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const formData = new FormData()

    formData.append('_payload', JSON.stringify({}))
    formData.append('file', new File([file], 'image.png', { type: 'image/png' }))

    const response = await restClient.POST(`/${mediaWithPrefixSlug}`, { body: formData })
    const { doc } = await response.json()
    const { blobs } = await list()

    expect(response.status).toBe(201)
    expect(doc.filename).toMatch(/^image-[a-z0-9]+\.png$/)
    expect(blobs.map((blob) => blob.pathname)).toContain(`${prefix}/${doc.filename}`)
  })

  test("should reject upload when 'x-disallow-access' header is set", async ({ restClient }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const response = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
      headers: { 'x-disallow-access': 'true' },
    })

    expect(response.status).toBe(403)
  })

  test('should reject invalid upload metadata', async ({ restClient }) => {
    for (const body of [
      uploadMetadata(),
      uploadMetadata('constructor'),
      { ...uploadMetadata('media'), docPrefix: 1 },
    ]) {
      const response = await restClient.POST(uploadInstructionsPath, {
        body: JSON.stringify(body),
      })

      expect(response.ok).toBe(false)
    }
  })

  test('should upload a file with prefix via client upload flow', async ({ restClient }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media-with-prefix', file.length)),
    })
    const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions

    const result = await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(prefix)
    expect(result.url).toContain(instructions.file.filename)

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === instructions.data.pathname)
    expect(uploaded).toBeDefined()
  })

  for (const { collectionSlug, format, shouldCrop } of [
    { collectionSlug: mediaWithPrefixSlug, format: 'webp', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'gif', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'tiff', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'png', shouldCrop: true },
    { collectionSlug: mediaSlug, format: 'png', shouldCrop: false },
    { collectionSlug: mediaSlug, format: 'png', shouldCrop: true },
    { collectionSlug: mediaWithPrefixSlug, format: 'png', shouldCrop: false },
  ] as const) {
    test(`should preserve stored bytes after saving a ${format} client upload (collection: ${collectionSlug}, crop: ${shouldCrop})`, async ({
      payload,
      restClient,
    }) => {
      const file = await sharp({
        create: { background: '#336699', channels: 3, height: 80, width: 120 },
      })
        .toFormat(format)
        .toBuffer()
      const mimeType = `image/${format}`
      const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
        body: JSON.stringify({
          collectionSlug,
          filename: `processed.${format === 'tiff' ? 'tif' : format}`,
          filesize: file.length,
          mimeType,
        }),
      })

      expect(instructionsResponse.status).toBe(200)

      const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions
      const uploaded = await put(instructions.data.pathname, new Blob([file], { type: mimeType }), {
        access: 'public',
        contentType: mimeType,
        token: instructions.data.token,
      })

      expect((await head(uploaded.url)).size).toBe(file.length)

      const formData = new FormData()

      formData.append('_payload', JSON.stringify({}))
      formData.append('file', JSON.stringify(instructions.file))

      const query = shouldCrop
        ? qs.stringify(
            {
              uploadEdits: {
                crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
                heightInPixels: 40,
                widthInPixels: 60,
              },
            },
            { addQueryPrefix: true },
          )
        : ''
      const response = await restClient.POST(`/${collectionSlug}${query}`, { body: formData })
      const { doc } = await response.json()

      expect(response.status).toBe(201)

      try {
        const { blobs } = await list()
        const storedDoc = await payload.findByID({
          id: doc.id,
          collection: collectionSlug,
          overrideAccess: true,
          showHiddenFields: true,
        })
        const storagePath = [storedDoc.prefix, storedDoc._objectKey, doc.filename]
          .filter(Boolean)
          .join('/')
        const stored = blobs.find((blob) => blob.pathname === storagePath)

        expect(doc.filename).toBe(instructions.file.filename)
        expect(storagePath).toBe(instructions.data.pathname)
        expect(blobs.every((blob) => blob.size > 0)).toBe(true)
        expect(
          Object.values(doc.sizes ?? {}).filter((size: { filename?: string }) => size.filename),
        ).toHaveLength(collectionSlug === mediaSlug ? 1 : 0)
        expect(stored).toBeDefined()
        expect(blobs).toHaveLength(
          1 +
            Object.values(doc.sizes ?? {}).filter((size: { filename?: string }) => size.filename)
              .length,
        )

        for (const size of Object.values(doc.sizes ?? {})) {
          if (!size.filename) {
            continue
          }
          const sizePath = [storedDoc.prefix, storedDoc._objectKey, size.filename]
            .filter(Boolean)
            .join('/')
          const storedSize = blobs.find((blob) => blob.pathname === sizePath)

          expect(storedSize).toBeDefined()
          expect(storedSize!.size).toBe(size.filesize)

          const sizeBytes = Buffer.from(await (await fetch(storedSize!.url)).arrayBuffer())

          expect(await sharp(sizeBytes).metadata()).toMatchObject({
            height: size.height,
            width: size.width,
          })
        }

        const download = await fetch(stored!.url)
        const bytes = Buffer.from(await download.arrayBuffer())

        expect(doc.filesize).toBeGreaterThan(0)
        expect(stored!.size).toBe(doc.filesize)
        expect(download.status).toBe(200)
        expect(bytes.length).toBe(doc.filesize)

        const served = await restClient.GET(doc.url.replace(/^\/api/, ''))

        expect(served.status).toBe(200)
        expect(Buffer.from(await served.arrayBuffer()).equals(bytes)).toBe(true)
        expect(await sharp(bytes).metadata()).toMatchObject({
          format,
          height: collectionSlug === mediaSlug ? 200 : shouldCrop ? 40 : 80,
          width: collectionSlug === mediaSlug ? 200 : shouldCrop ? 60 : 120,
        })
      } finally {
        await payload.delete({ id: doc.id, collection: collectionSlug, overrideAccess: true })
      }
    })
  }
})
