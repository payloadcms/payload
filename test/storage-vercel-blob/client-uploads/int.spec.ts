import type { CollectionSlug, Payload, UploadInstructions } from 'payload'

import { del, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaSlug, mediaWithStaticDirSlug, prefix } from '../shared.js'
import { staticDir } from './collections/MediaWithStaticDir.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient

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

describe('@payloadcms/storage-vercel-blob clientUploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    const { blobs } = await list()
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  it('should upload a file via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
    })

    expect(instructionsResponse.status).toBe(200)

    const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions
    expect(instructions.type).toBe('dispatch')
    expect(instructions.name).toBe('uploadToVercelBlob')
    expect(instructions.file).toEqual({
      filename: 'image.png',
      mimeType: 'image/png',
      size: file.length,
      uploadReference: { prefix: '' },
    })

    const result = await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === 'image.png')
    expect(uploaded).toBeDefined()
  })

  it("should reject upload when 'x-disallow-access' header is set", async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const response = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
      headers: { 'x-disallow-access': 'true' },
    })

    expect(response.status).toBe(403)
  })

  it('should reject invalid upload metadata', async () => {
    for (const body of [
      uploadMetadata(),
      uploadMetadata('constructor'),
      { ...uploadMetadata('media'), docPrefix: 1 },
    ]) {
      const response = await restClient.POST(uploadInstructionsPath, {
        body: JSON.stringify(body),
      })

      expect(response.status).toBe(400)
    }
  })

  it('should upload a file with prefix via client upload flow', async () => {
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
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === `${prefix}/image.png`)
    expect(uploaded).toBeDefined()
  })

  describe('filenames resolved before the client upload', () => {
    const createdMedia: { collection: string; id: number | string }[] = []

    const firstFile = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const secondFile = readFileSync(path.resolve(dirname, '../../uploads/test-image.png'))

    afterEach(async () => {
      for (const { id, collection } of createdMedia) {
        await payload.delete({ id, collection: collection as CollectionSlug })
      }
      createdMedia.length = 0

      await rm(staticDir, { force: true, recursive: true })
    })

    const requestInstructions = (
      contents: Buffer<ArrayBuffer>,
      collectionSlug: string = mediaSlug,
    ) =>
      restClient
        .POST(uploadInstructionsPath, {
          body: JSON.stringify({
            collectionSlug,
            filename: 'image.png',
            filesize: contents.length,
            mimeType: 'image/png',
          }),
        })
        .then(async (response) => (await response.json()) as VercelBlobUploadInstructions)

    /** Mirrors the browser: PUT the bytes, then return the file to send on create. */
    const uploadFromClient = async (
      instructions: VercelBlobUploadInstructions,
      contents: Buffer<ArrayBuffer>,
    ) => {
      const result = await put(
        instructions.data.pathname,
        new Blob([contents], { type: 'image/png' }),
        {
          access: 'public',
          contentType: 'image/png',
          token: instructions.data.token,
        },
      )

      const uploadedFilename = decodeURIComponent(result.pathname.split('/').pop()!)

      return { ...instructions.file, filename: uploadedFilename }
    }

    const createMedia = async (
      file: UploadInstructions['file'],
      collectionSlug: string = mediaSlug,
    ) => {
      const formData = new FormData()
      formData.append('_payload', JSON.stringify({}))
      formData.append('file', JSON.stringify(file))

      return await postMedia(formData, collectionSlug)
    }

    /** Uploads through Payload instead of the client, so the server stores the file itself. */
    const createMediaFromFile = async (contents: Buffer<ArrayBuffer>) => {
      const formData = new FormData()
      formData.append('_payload', JSON.stringify({}))
      formData.append('file', new Blob([contents], { type: 'image/png' }), 'image.png')

      return await postMedia(formData, mediaSlug)
    }

    const postMedia = async (formData: FormData, collectionSlug: string) => {
      const response = await restClient.POST(`/${collectionSlug}`, { body: formData })
      const { doc } = await response.json()

      expect(response.status).toBe(201)
      createdMedia.push({ id: doc.id, collection: collectionSlug })

      return doc
    }

    it('should store the second upload under a unique blob and keep the first blob intact', async () => {
      await createMedia(await uploadFromClient(await requestInstructions(firstFile), firstFile))
      const second = await createMedia(
        await uploadFromClient(await requestInstructions(secondFile), secondFile),
      )

      expect(second.filename).toBe('image-1.png')

      const { blobs } = await list()
      const original = blobs.find((blob) => blob.pathname === 'image.png')
      const duplicate = blobs.find((blob) => blob.pathname === second.filename)

      // The first upload's bytes are still there, untouched by the second upload
      expect(original?.size).toBe(firstFile.length)
      expect(duplicate).toBeDefined()
    })

    /**
     * The blob is stored under the filename the client reserved, but the document is uniquified
     * while saving because another document claimed that filename in the meantime. The renamed
     * document still needs a blob of its own.
     */
    it('should store a blob for a client upload that is renamed while saving', async () => {
      const upload = await uploadFromClient(await requestInstructions(firstFile), firstFile)

      const other = await createMediaFromFile(secondFile)
      const renamed = await createMedia(upload)

      expect(other.filename).toBe('image.png')
      expect(renamed.filename).toBe('image-1.png')

      const { blobs } = await list()
      expect(blobs.find((blob) => blob.pathname === renamed.filename)).toBeDefined()
    })

    it('should ignore files in staticDir when the collection stores its files in the adapter', async () => {
      await mkdir(staticDir, { recursive: true })
      await writeFile(path.join(staticDir, 'image.png'), firstFile)

      const instructions = await requestInstructions(firstFile, mediaWithStaticDirSlug)
      const doc = await createMedia(
        await uploadFromClient(instructions, firstFile),
        mediaWithStaticDirSlug,
      )

      expect(doc.filename).toBe('image.png')

      const { blobs } = await list()
      expect(blobs.find((blob) => blob.pathname === 'image.png')).toBeDefined()
    })
  })
})
