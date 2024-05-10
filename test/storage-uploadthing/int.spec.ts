import type { Payload } from 'payload'

import dotenv from 'dotenv'
import path from 'path'
import { UTApi, UTFile } from 'uploadthing/server'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load config to work with emulated services
dotenv.config({
  path: path.resolve(dirname, './.env'),
})

let payload: Payload

describe('@payloadcms/storage-uploadthing', () => {
  let client: UTApi
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))

    client = new UTApi({ apiKey: process.env.UPLOADTHING_SECRET })
  })

  it('can upload', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaSlug,
      uploadId: upload.id,
    })

    // expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
    expect(upload.url).toEqual(`https://utfs.io/f/${String(upload.filename)}`)
  })

  it('can upload with prefix', async () => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaWithPrefixSlug,
      uploadId: upload.id,
      prefix,
    })
    expect(upload.url).toEqual(`/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}`)
  })

  describe('R2', () => {
    it.todo('can upload')
  })

  async function verifyUploads({
    collectionSlug,
    uploadId,
    prefix = '',
  }: {
    collectionSlug: string
    prefix?: string
    uploadId: number | string
  }) {
    const uploadData = (await payload.findByID({
      collection: collectionSlug,
      id: uploadId,
    })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

    const fileKeys = Object.keys(uploadData.sizes || {}).map((key) => {
      const rawFilename = uploadData.sizes[key].filename
      return prefix ? `${prefix}/${rawFilename}` : rawFilename
    })

    fileKeys.push(`${prefix ? `${prefix}/` : ''}${uploadData.filename}`)

    console.log('Verifying uploads:', fileKeys)

    // TODO: use UTApi to verify uploads

    // try {
    //   for (const key of fileKeys) {
    //     const { $metadata } = await client.send(
    //       new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: key }),
    //     )

    //     if ($metadata.httpStatusCode !== 200) {
    //       console.error('Error verifying uploads', key, $metadata)
    //       throw new Error(`Error verifying uploads: ${key}, ${$metadata.httpStatusCode}`)
    //     }

    //     // Verify each size was properly uploaded
    //     expect($metadata.httpStatusCode).toBe(200)
    //   }
    // } catch (error: unknown) {
    //   console.error('Error verifying uploads:', fileKeys, error)
    //   throw error
    // }
  }
})
