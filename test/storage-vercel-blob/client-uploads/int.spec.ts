/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { UploadInstructions } from 'payload'

import { del, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { prefix } from '../shared.js'

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

  for (const outcome of ['complete', 'rollback', 'retain shared source'] as const) {
    const shouldFail = outcome !== 'complete'
    const options = shouldFail ? { db: 'mongo' as const } : {}

    test.options(
      `should ${outcome} at the client-upload document write`,
      options,
      async ({ payload, restClient }) => {
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
          `${(instructions.file.uploadReference as { _objectKey: string })._objectKey}/image-original.png`,
        )

        const result = await put(
          instructions.data.pathname,
          new Blob([file], { type: 'image/png' }),
          {
            access: 'public',
            contentType: 'image/png',
            token: instructions.data.token,
          },
        )

        expect(result.url).toBeDefined()
        expect(result.url).toContain('image-original.png')

        const { blobs } = await list()
        const uploaded = blobs.find((b) => b.pathname === instructions.data.pathname)
        expect(uploaded).toBeDefined()

        const formData = new FormData()
        formData.append('_payload', JSON.stringify({}))
        formData.append('file', JSON.stringify(instructions.file))

        if (outcome === 'retain shared source') {
          const firstCreate = await restClient.POST('/media', { body: formData })

          expect(firstCreate.status).toBe(201)
          const { doc } = await firstCreate.json()
          // Keep the original reference while giving this document a different main filename.
          await payload.db.updateOne({
            collection: 'media',
            data: { filename: 'previous-main.png' },
            where: { id: { equals: doc.id } },
          })
        }

        const hooks = payload.collections.media.config.hooks
        const afterChange = hooks.afterChange

        if (shouldFail) {
          hooks.afterChange = [
            ...afterChange,
            () => {
              throw new Error('Client document hook failed')
            },
          ]
        }

        try {
          const createdResponse = await restClient.POST('/media', { body: formData })
          const { blobs: remaining } = await list()

          if (shouldFail) {
            expect(createdResponse.status).toBe(500)
            expect(remaining.map(({ pathname }) => pathname)).toEqual(
              outcome === 'retain shared source' ? [instructions.data.pathname] : [],
            )
            expect(
              (await payload.count({ collection: 'media', overrideAccess: true })).totalDocs,
            ).toBe(outcome === 'retain shared source' ? 1 : 0)
          } else {
            expect(createdResponse.status).toBe(201)
            const { doc } = await createdResponse.json()

            expect(doc.filename).toBe('image-original.png')
            expect(doc.original.filename).toBe('image-original.png')
            expect(remaining.map(({ pathname }) => pathname)).toEqual([instructions.data.pathname])
            const storedResponse = await restClient.GET(`/media/file/${doc.filename}`)

            expect(storedResponse.status).toBe(200)
            expect(Buffer.from(await storedResponse.arrayBuffer())).toEqual(file)
          }
        } finally {
          hooks.afterChange = afterChange
        }
      },
    )
  }

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
    expect(result.url).toContain('image-original.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === instructions.data.pathname)
    expect(uploaded).toBeDefined()
  })
})
