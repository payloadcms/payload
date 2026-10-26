/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { CollectionBeforeChangeHook, Payload } from 'payload'

import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect } from 'vitest'

import type { UploadTransforms } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { transformedMediaDir, transformedMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 1600 x 1600 PNG
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const replacementFixture = path.resolve(dirname, '../uploads/small.png')
const transformStateError = {
  data: { errors: [expect.objectContaining({ path: '_transforms' })] },
}

test.suite('File transform state', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(transformedMediaDir, { force: true, recursive: true })
  })

  const createImage = async ({
    payload,
    _transforms,
  }: {
    _transforms?: UploadTransforms
    payload: Payload
  }) => {
    const bytes = await readFile(imageFixture)

    return payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source', ...(_transforms === undefined ? {} : { _transforms }) },
      file: { name: 'square.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
  }

  test('should start new uploads with null transform state', async ({ payload }) => {
    const created = await createImage({ payload })

    expect(created._transforms).toBeNull()
  })

  test('should keep saved transform state when an update omits it', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { focalPoint: { x: 20, y: 30 } } })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { alt: 'renamed' },
    })

    expect(updated._transforms).toEqual({ focalPoint: { x: 20, y: 30 } })
  })

  test('should clear transform state when an update sends null', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { focalPoint: { x: 20, y: 30 } } })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: null },
    })

    expect(updated._transforms).toBeNull()
  })

  test('should replace the whole transform state when an update sends an object', async ({
    payload,
  }) => {
    const created = await createImage({
      payload,
      _transforms: {
        crop: { height: 800, width: 800, x: 0, y: 0 },
        focalPoint: { x: 20, y: 30 },
      },
    })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: { focalPoint: { x: 60, y: 70 } } },
    })

    expect(updated._transforms).toEqual({ focalPoint: { x: 60, y: 70 } })
  })

  test('should store an empty transform object as null', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: {} })

    expect(created._transforms).toBeNull()
  })

  test('should reject a reserved built-in key that nothing applies yet', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { resize: { width: 100 } } }),
    ).rejects.toMatchObject({
      data: {
        errors: [
          expect.objectContaining({
            message: expect.stringContaining('resize'),
            path: '_transforms',
          }),
        ],
      },
    })
  })

  test('should keep unknown custom keys unchanged', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: { watermark: { opacity: 0.5, position: 'bottom-right' } },
    })

    expect(created._transforms).toEqual({
      watermark: { opacity: 0.5, position: 'bottom-right' },
    })
  })

  test('should crop the main file when transform state contains a crop', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 600, width: 800, x: 100, y: 200 } },
    })

    expect(created).toMatchObject({ height: 600, width: 800 })
    expect(created.original).toMatchObject({ height: 1600, width: 1600 })
    await expect(
      sharp(path.join(transformedMediaDir, created.filename!)).metadata(),
    ).resolves.toMatchObject({ height: 600, width: 800 })
  })

  test('should save an admin percent crop as original pixels', async ({ payload, restClient }) => {
    const created = await createImage({ payload })

    const response = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'cropped' }),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 25, x: 10, y: 20 },
          heightInPixels: 800,
          widthInPixels: 400,
        },
      },
    })
    const { doc } = await response.json()

    expect(response.status).toBe(200)
    expect(doc._transforms).toEqual({ crop: { height: 800, width: 400, x: 160, y: 320 } })
  })

  test('should save an admin crop and focal point sent in the query string', async ({
    payload,
    restClient,
  }) => {
    const created = await createImage({ payload })

    // The admin editor sends both edits in the query string, so every value arrives as a string.
    const response = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ _transforms: null, alt: 'cropped', focalX: 50, focalY: 50 }),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 25, x: 10, y: 20 },
          focalPoint: { x: 30, y: 60 },
          heightInPixels: 800,
          widthInPixels: 400,
        },
      },
    })
    const { doc, errors } = await response.json()

    expect(errors).toBeUndefined()
    expect(response.status).toBe(200)
    expect(doc).toMatchObject({ focalX: 30, focalY: 60 })
    expect(doc._transforms).toEqual({
      crop: { height: 800, width: 400, x: 160, y: 320 },
      focalPoint: { x: 30, y: 60 },
    })
  })

  test('should crop from the original when the saved crop changes', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 800, width: 800, x: 400, y: 400 } },
    })

    // Larger than the first crop: only possible when the source is the original.
    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: { crop: { height: 1200, width: 1200, x: 0, y: 0 } } },
    })

    expect(updated).toMatchObject({ height: 1200, width: 1200 })
    await expect(
      sharp(path.join(transformedMediaDir, updated.filename!)).metadata(),
    ).resolves.toMatchObject({ height: 1200, width: 1200 })
  })

  test('should serve the original again when the saved crop is removed', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 800, width: 800, x: 0, y: 0 } },
    })

    expect(created).toMatchObject({ height: 800, width: 800 })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: null },
    })

    expect(updated).toMatchObject({ height: 1600, width: 1600 })
    expect(updated.filename).toBe(updated.original?.filename)
    expect(await readFile(path.join(transformedMediaDir, updated.filename!))).toEqual(bytes)
  })

  test('should keep the saved crop when only the focal point changes', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 600, width: 800, x: 0, y: 0 } },
    })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { focalX: 75, focalY: 25 },
    })

    expect(updated).toMatchObject({ height: 600, width: 800 })
    expect(updated._transforms).toEqual({
      crop: { height: 600, width: 800, x: 0, y: 0 },
      focalPoint: { x: 75, y: 25 },
    })
  })

  test('should write the focal point to transform state when focalX and focalY are sent', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { focalX: 75, focalY: 25 },
    })

    expect(updated).toMatchObject({ focalX: 75, focalY: 25 })
    expect(updated._transforms).toEqual({ focalPoint: { x: 75, y: 25 } })
  })

  test('should write focalX and focalY when transform state has a focal point', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: { focalPoint: { x: 10, y: 90 } } },
    })

    expect(updated).toMatchObject({ focalX: 10, focalY: 90 })
  })

  test('should use the transform state focal point when focalX and focalY disagree', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    // The admin sends the current focalX and focalY again on every save.
    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { _transforms: { focalPoint: { x: 10, y: 90 } }, focalX: 50, focalY: 50 },
    })

    expect(updated).toMatchObject({ focalX: 10, focalY: 90 })
    expect(updated._transforms).toEqual({ focalPoint: { x: 10, y: 90 } })
  })

  test('should clear transform state when the file is replaced without new state', async ({
    payload,
  }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 800, width: 800, x: 0, y: 0 } },
    })
    const bytes = await readFile(replacementFixture)

    const updated = await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: {},
      file: { name: 'replacement.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    expect(updated._transforms).toBeNull()
  })

  test('should give beforeChange hooks the final cropped dimensions', async ({ payload }) => {
    const seen: { height?: number; width?: number }[] = []
    const hook: CollectionBeforeChangeHook = ({ data }) => {
      seen.push({ height: data.height, width: data.width })
      return data
    }
    const hooks = payload.collections[transformedMediaSlug]!.config.hooks
    hooks.beforeChange.push(hook)

    try {
      await createImage({
        payload,
        _transforms: { crop: { height: 600, width: 800, x: 0, y: 0 } },
      })
    } finally {
      hooks.beforeChange.splice(hooks.beforeChange.indexOf(hook), 1)
    }

    expect(seen).toEqual([{ height: 600, width: 800 }])
  })

  test('should reject a crop outside the original', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { crop: { height: 800, width: 800, x: 1000, y: 0 } } }),
    ).rejects.toMatchObject(transformStateError)
  })

  test('should reject a crop with non-integer pixels', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { crop: { height: 800, width: 800.5, x: 0, y: 0 } } }),
    ).rejects.toMatchObject(transformStateError)
  })

  test('should reject a crop with zero size', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { crop: { height: 0, width: 800, x: 0, y: 0 } } }),
    ).rejects.toMatchObject(transformStateError)
  })

  test('should reject a focal point outside 0 to 100', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { focalPoint: { x: 120, y: 50 } } }),
    ).rejects.toMatchObject(transformStateError)
  })

  test('should name the failing key when a value has the wrong type', async ({ payload }) => {
    await expect(
      // @ts-expect-error -- a wrong type on purpose
      createImage({ payload, _transforms: { focalPoint: { x: '30', y: 50 } } }),
    ).rejects.toMatchObject({
      data: {
        errors: [
          expect.objectContaining({
            message: expect.stringContaining('focalPoint.x'),
            path: '_transforms',
          }),
        ],
      },
    })
  })
})
