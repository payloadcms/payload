import type { Payload } from 'payload'

import { getStore } from '@netlify/blobs'
import { BlobsServer } from '@netlify/blobs/server'
import { tmpdir } from 'os'
import path, { join } from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('@payloadcms/storage-netlify-blobs', () => {
  let server: BlobsServer
  const token = 'mock'
  const directory = join(tmpdir(), 'netlify-blobs')

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))

    server = new BlobsServer({
      directory,
      debug: !true,
      token,
      port: 8971,
    })

    await server.start()
  })

  afterAll(async () => {
    if (typeof payload?.db?.destroy === 'function') {
      await payload.db.destroy()
    }
    await server.stop()
  })

  afterEach(async () => {
    const store = getStore('payload')
    const { blobs } = await store.list()
    for (const item of blobs) {
      await store.delete(item.key)
    }
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

    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
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
    const store = getStore('payload')
    try {
      for (const key of fileKeys) {
        const res = await store.getMetadata(key)
        expect(res).toBeTruthy()
      }
    } catch (error: unknown) {
      console.error('Error verifying uploads:', fileKeys, error)
      throw error
    }
  }
})
