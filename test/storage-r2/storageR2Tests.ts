/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { r2Bucket } from './config.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const imagePath = path.resolve(dirname, '../uploads/image.png')

const toFilePath = (url?: null | string) => url!.replace(/^\/api/, '') as `/${string}`

/** The adapter's tests, shared by the default run and the `NODE_ENV=development` run. */
export const storageR2Tests = () => {
  test.afterEach(async () => {
    const { objects } = await r2Bucket.list()

    if (objects.length) {
      await r2Bucket.delete(objects.map(({ key }: { key: string }) => key))
    }
  })

  test('should serve an upload with its stored content type and response headers', async ({
    payload,
    restClient,
  }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })

    const response = await restClient.GET(toFilePath(upload.url))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe(upload.mimeType)
    expect(response.headers.get('X-Universal-Truth')).toBe('Set')
    expect((await response.arrayBuffer()).byteLength).toBe(upload.filesize)
  })

  test('should serve only the requested byte range', async ({ payload, restClient }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })
    const fullBody = Buffer.from(await (await restClient.GET(toFilePath(upload.url))).arrayBuffer())

    const response = await restClient.GET(toFilePath(upload.url), {
      headers: { Range: 'bytes=0-99' },
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe(`bytes 0-99/${upload.filesize}`)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(fullBody.subarray(0, 100))
  })

  test('should reject a range past the end of the file', async ({ payload, restClient }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })

    const response = await restClient.GET(toFilePath(upload.url), {
      headers: { Range: `bytes=${upload.filesize}-` },
    })

    expect(response.status).toBe(416)
  })

  test('should return 404 when the file is not found', async ({ restClient }) => {
    const response = await restClient.GET(`/${mediaSlug}/file/missing.png`)

    expect(response.status).toBe(404)
  })

  test('should serve image variants stored next to the upload', async ({ payload, restClient }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })

    const response = await restClient.GET(toFilePath(upload.variants?.square?.url))

    expect(response.status).toBe(200)
    expect((await response.arrayBuffer()).byteLength).toBe(upload.variants?.square?.filesize)
  })

  test('should store and serve uploads under the collection prefix', async ({
    payload,
    restClient,
  }) => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })

    const response = await restClient.GET(toFilePath(upload.url))

    expect(upload.url).toBe(`/api/${mediaWithPrefixSlug}/file/${upload.filename}?prefix=${prefix}`)
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(readFileSync(imagePath))
  })

  test('should delete the stored file with its document', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: imagePath,
      overrideAccess: true,
    })
    const storageFilePath = path.posix.join(prefix, upload._objectKey!, upload.filename!)

    expect(await r2Bucket.head(storageFilePath)).not.toBeNull()

    await payload.delete({ id: upload.id, collection: mediaWithPrefixSlug, overrideAccess: true })

    expect(await r2Bucket.head(storageFilePath)).toBeNull()
  })
}
