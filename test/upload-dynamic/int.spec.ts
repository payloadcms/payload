/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import type { Payload, RequestContext } from 'payload'

import { readdir, readFile, rm } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { dynamicMediaDir, dynamicMediaSlug, publicCloudMediaSlug } from './shared.js'
import { requestCropCalls } from './transformers.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 1600 x 1600 PNG
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const savedCrop = { height: 600, width: 800, x: 100, y: 200 }

test.suite('Dynamic default file', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    requestCropCalls.length = 0
    await rm(dynamicMediaDir, { force: true, recursive: true })
  })

  const createImage = async ({
    _transforms = { crop: savedCrop },
    collection = dynamicMediaSlug,
    context,
    payload,
  }: {
    _transforms?: Record<string, unknown>
    collection?: typeof dynamicMediaSlug | typeof publicCloudMediaSlug
    context?: RequestContext
    payload: Payload
  }) => {
    const bytes = await readFile(imageFixture)

    return payload.create({
      collection,
      context,
      data: { _transforms },
      file: { name: 'photo.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
  }

  // Reads the saved row, so the check does not depend on how the API shows a missing value.
  const readStoredFlag = async ({ id, payload }: { id: number | string; payload: Payload }) =>
    (
      (await payload.db.findOne({
        collection: dynamicMediaSlug,
        where: { id: { equals: id } },
      })) as {
        _stored?: boolean | null
      }
    )._stored

  test('should save a crop that only a request-time transformer applies, storing only the original', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    expect(await readStoredFlag({ id: created.id, payload })).toBe(false)
    expect(created.filename).toBe(created.original?.filename)
    expect(await readdir(dynamicMediaDir)).toEqual([created.original?.filename])
  })

  test('should describe the default file with the crop size, the original MIME type and no file size', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    expect(created).toMatchObject({
      filesize: null,
      height: 600,
      mimeType: 'image/png',
      width: 800,
    })
    expect(created.original).toMatchObject({ height: 1600, mimeType: 'image/png', width: 1600 })
  })

  test('should apply the saved crop on the plain URL and serve the original with ?original=true', async ({
    payload,
    restClient,
  }) => {
    const created = await createImage({ payload })
    const filePath = `/${dynamicMediaSlug}/file/${created.filename}` as const

    const plain = await restClient.GET(filePath)
    const original = await restClient.GET(`${filePath}?original=true`)

    expect(await sharp(Buffer.from(await plain.arrayBuffer())).metadata()).toMatchObject({
      format: 'png',
      height: 600,
      width: 800,
    })
    expect(requestCropCalls).toEqual([{ crop: savedCrop, purpose: 'persisted-default' }])
    expect(Buffer.from(await original.arrayBuffer()).equals(await readFile(imageFixture))).toBe(
      true,
    )
    expect(created.original?.url).toMatch(/\?original=true$/)
  })

  test('should store the file when an upload-time and a request-time transformer both apply the crop', async ({
    payload,
  }) => {
    const created = await createImage({ context: { isUploadCropEnabled: true }, payload })

    expect(await readStoredFlag({ id: created.id, payload })).not.toBe(false)
    expect(created.filesize).toBeGreaterThan(0)
    expect(await sharp(path.join(dynamicMediaDir, created.filename!)).metadata()).toMatchObject({
      height: 600,
      width: 800,
    })
  })

  test('should treat a plain read of a dynamic file as an ordinary read, and query parameters as a transform', async ({
    payload,
    restClient,
  }) => {
    const created = await createImage({ payload })
    const filePath = `/${dynamicMediaSlug}/file/${created.filename}` as const

    expect((await restClient.GET(filePath, { auth: false })).status).toBe(200)
    expect((await restClient.GET(`${filePath}?w=100`, { auth: false })).status).toBe(403)
  })

  test('should keep a duplicate dynamic, with its own copy of the original', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const copy = await payload.duplicate({ id: created.id, collection: dynamicMediaSlug })

    expect(await readStoredFlag({ id: copy.id, payload })).toBe(false)
    expect(copy.original?.filename).not.toBe(created.original?.filename)
    expect((await readdir(dynamicMediaDir)).sort()).toEqual(
      [created.original?.filename, copy.original?.filename].sort(),
    )
  })

  test('should rename the main file and the stored original of a dynamic document together', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const renamed = await payload.renameFile({
      id: created.id,
      collection: dynamicMediaSlug,
      filename: 'renamed.png',
      overrideAccess: true,
    })

    expect(renamed).toMatchObject({
      filename: 'renamed.png',
      original: { filename: 'renamed.png' },
      url: expect.stringMatching(/\/file\/renamed\.png$/),
    })
    expect(await readStoredFlag({ id: created.id, payload })).toBe(false)
    // The version saved before the rename still uses the old file.
    expect((await readdir(dynamicMediaDir)).sort()).toEqual(['photo.png', 'renamed.png'])
  })

  test('should update the default file metadata when the crop changes, without writing a file', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const updated = await payload.update({
      id: created.id,
      collection: dynamicMediaSlug,
      data: { _transforms: { crop: { height: 100, width: 200, x: 0, y: 0 } } },
    })

    expect(await readStoredFlag({ id: created.id, payload })).toBe(false)
    expect(updated).toMatchObject({ filename: created.filename, height: 100, width: 200 })
    expect(await readdir(dynamicMediaDir)).toEqual([created.original?.filename])
  })

  test('should store the default file again when the saved crop is removed', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const updated = await payload.update({
      id: created.id,
      collection: dynamicMediaSlug,
      data: { _transforms: null },
    })

    expect(await readStoredFlag({ id: created.id, payload })).not.toBe(false)
    expect(updated).toMatchObject({ height: 1600, width: 1600 })
    expect(updated.filesize).toBeGreaterThan(0)
  })

  test('should give a dynamic default file the Payload file route, even when files are served directly', async ({
    payload,
  }) => {
    const created = await createImage({ collection: publicCloudMediaSlug, payload })

    expect(created.url).toMatch(new RegExp(`/api/${publicCloudMediaSlug}/file/photo\\.png$`))
    expect(created.original?.url).toMatch(/^https:\/\/files\.example\.test\//)
  })
})
