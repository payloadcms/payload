/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.for", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { CollectionBeforeChangeHook, Payload } from 'payload'

import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect } from 'vitest'

import type { FileVersionedTransformedMedia, UploadTransforms } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { legacyFocalPoints } from './seedLegacyMedia.js'
import {
  draftMediaDir,
  draftMediaSlug,
  legacyMediaDir,
  legacyMediaSlug,
  transformedMediaDir,
  transformedMediaSlug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 1600 x 1600 PNG
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const replacementFixture = path.resolve(dirname, '../uploads/small.png')
const savedCrop = { height: 600, width: 800, x: 0, y: 0 }

test.suite('File transform state', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(transformedMediaDir, { force: true, recursive: true })
    await rm(legacyMediaDir, { force: true, recursive: true })
    await rm(draftMediaDir, { force: true, recursive: true })
  })

  const createImage = async ({
    name = 'square.png',
    payload,
    _transforms,
  }: {
    _transforms?: UploadTransforms
    name?: string
    payload: Payload
  }) => {
    const bytes = await readFile(imageFixture)

    return payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source', ...(_transforms === undefined ? {} : { _transforms }) },
      file: { name, data: bytes, mimetype: 'image/png', size: bytes.length },
    })
  }

  const updateImage = ({
    id,
    data,
    payload,
  }: {
    data: Partial<FileVersionedTransformedMedia>
    id: number | string
    payload: Payload
  }) => payload.update({ id, collection: transformedMediaSlug, data })

  const readStoredSize = (filename: string) =>
    sharp(path.join(transformedMediaDir, filename)).metadata()

  test.for([
    { name: 'no transform state', _transforms: undefined },
    { name: 'an empty transform object', _transforms: {} },
  ])('should store $name as null on create', async ({ _transforms }, { payload }) => {
    const created = await createImage({ payload, _transforms })

    expect(created._transforms).toBeNull()
  })

  test.for([
    {
      name: 'keep the saved state when an update omits it',
      data: { alt: 'renamed' },
      expected: { crop: savedCrop, focalPoint: { x: 20, y: 30 } },
    },
    {
      name: 'clear the saved state when an update sends null',
      data: { _transforms: null },
      expected: null,
    },
    {
      name: 'replace the whole saved state when an update sends an object',
      data: { _transforms: { focalPoint: { x: 60, y: 70 } } },
      expected: { focalPoint: { x: 60, y: 70 } },
    },
  ])('should $name', async ({ data, expected }, { payload }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: savedCrop, focalPoint: { x: 20, y: 30 } },
    })

    const updated = await updateImage({ id: created.id, data, payload })

    expect(updated._transforms).toEqual(expected)
  })

  test('should reject a built-in key that no transformer applies', async ({ payload }) => {
    await expect(
      createImage({ payload, _transforms: { resize: { width: 100 } } }),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: '_transforms.resize' })] },
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

  test.for([
    {
      name: 'a crop outside the original',
      _transforms: { crop: { ...savedCrop, x: 1000 } },
      failingKey: 'crop',
    },
    {
      name: 'a crop with non-integer pixels',
      _transforms: { crop: { ...savedCrop, width: 800.5 } },
      failingKey: 'crop',
    },
    {
      name: 'a crop with zero size',
      _transforms: { crop: { ...savedCrop, height: 0 } },
      failingKey: 'crop',
    },
    {
      name: 'a focal point outside 0 to 100',
      _transforms: { focalPoint: { x: 120, y: 50 } },
      failingKey: 'focalPoint',
    },
    {
      name: 'a value with the wrong type',
      _transforms: { focalPoint: { x: '30', y: 50 } },
      failingKey: 'focalPoint.x',
    },
  ])(
    'should reject $name and name the failing key',
    async ({ _transforms, failingKey }, { payload }) => {
      await expect(
        createImage({ payload, _transforms: _transforms as UploadTransforms }),
      ).rejects.toMatchObject({
        data: {
          errors: [
            expect.objectContaining({
              message: expect.stringContaining(failingKey),
              path: '_transforms',
            }),
          ],
        },
      })
    },
  )

  test('should crop the main file when transform state contains a crop', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 600, width: 800, x: 100, y: 200 } },
    })

    expect(created).toMatchObject({ height: 600, width: 800 })
    expect(created.original).toMatchObject({ height: 1600, width: 1600 })
    await expect(readStoredSize(created.filename!)).resolves.toMatchObject({
      height: 600,
      width: 800,
    })
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
    const updated = await updateImage({
      id: created.id,
      data: { _transforms: { crop: { height: 1200, width: 1200, x: 0, y: 0 } } },
      payload,
    })

    expect(updated).toMatchObject({ height: 1200, width: 1200 })
    await expect(readStoredSize(updated.filename!)).resolves.toMatchObject({
      height: 1200,
      width: 1200,
    })
  })

  test('should serve the original again when the saved crop is removed', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await createImage({
      payload,
      _transforms: { crop: { height: 800, width: 800, x: 0, y: 0 } },
    })

    expect(created).toMatchObject({ height: 800, width: 800 })

    const updated = await updateImage({ id: created.id, data: { _transforms: null }, payload })

    expect(updated).toMatchObject({ height: 1600, width: 1600 })
    expect(updated.filename).toBe(updated.original?.filename)
    expect(await readFile(path.join(transformedMediaDir, updated.filename!))).toEqual(bytes)
  })

  test('should move a legacy focal point into transform state on the first write', async ({
    payload,
  }) => {
    const {
      docs: [legacy],
    } = await payload.find({
      collection: legacyMediaSlug,
      where: { alt: { equals: 'legacy off-center' } },
    })

    expect(legacy!._transforms).toBeNull()

    const updated = await payload.update({
      id: legacy!.id,
      collection: legacyMediaSlug,
      data: { _transforms: { crop: savedCrop } },
    })

    expect(updated).toMatchObject({ focalX: 30, focalY: 70 })
    expect(updated._transforms).toEqual({
      crop: savedCrop,
      focalPoint: legacyFocalPoints['legacy off-center'],
    })
  })

  test('should keep the saved crop when only the focal point changes', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { crop: savedCrop } })

    const updated = await updateImage({ id: created.id, data: { focalX: 75, focalY: 25 }, payload })

    expect(updated).toMatchObject({ height: 600, width: 800 })
    expect(updated._transforms).toEqual({ crop: savedCrop, focalPoint: { x: 75, y: 25 } })
  })

  test.for([
    {
      name: 'save focalX when it is sent without focalY',
      data: { focalX: 30 },
      expected: { x: 30, y: 90 },
    },
    {
      name: 'save a focal point of 0 sent through focalX',
      data: { focalX: 0, focalY: 90 },
      expected: { x: 0, y: 90 },
    },
    {
      // The admin sends the stored, rounded focalX and focalY again on every save.
      name: 'keep a fractional focal point when the rounded focalX and focalY are sent back',
      data: { alt: 'renamed', focalX: 33, focalY: 90 },
      initial: { x: 33.3, y: 90 },
      expected: { x: 33.3, y: 90 },
    },
  ])('should $name', async ({ data, expected, initial = { x: 10, y: 90 } }, { payload }) => {
    const created = await createImage({ payload, _transforms: { focalPoint: initial } })

    const updated = await updateImage({ id: created.id, data, payload })

    expect(updated).toMatchObject({ focalX: Math.round(expected.x), focalY: expected.y })
    expect(updated._transforms).toEqual({ focalPoint: expected })
  })

  test('should use the transform state focal point when focalX and focalY disagree', async ({
    payload,
  }) => {
    const created = await createImage({ payload })

    // The admin sends the current focalX and focalY again on every save.
    const updated = await updateImage({
      id: created.id,
      data: { _transforms: { focalPoint: { x: 10, y: 90 } }, focalX: 50, focalY: 50 },
      payload,
    })

    expect(updated).toMatchObject({ focalX: 10, focalY: 90 })
    expect(updated._transforms).toEqual({ focalPoint: { x: 10, y: 90 } })
  })

  test('should clear transform state when the file is replaced without new state', async ({
    payload,
  }) => {
    const created = await createImage({ payload, _transforms: { crop: savedCrop } })
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
      await createImage({ payload, _transforms: { crop: savedCrop } })
    } finally {
      hooks.beforeChange.splice(hooks.beforeChange.indexOf(hook), 1)
    }

    expect(seen).toEqual([{ height: 600, width: 800 }])
  })

  const findVersionByAlt = async ({
    alt,
    id,
    payload,
  }: {
    alt: string
    id: number | string
    payload: Payload
  }) => {
    const { docs } = await payload.findVersions({
      collection: transformedMediaSlug,
      where: { parent: { equals: id } },
    })

    return docs.find(({ version }) => version.alt === alt)!
  }

  test('should restore the crop that belongs to the restored version', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { crop: savedCrop } })

    await updateImage({
      id: created.id,
      data: { _transforms: { crop: { height: 400, width: 400, x: 0, y: 0 } }, alt: 'second crop' },
      payload,
    })

    const restored = await payload.restoreVersion({
      id: (await findVersionByAlt({ id: created.id, alt: 'source', payload })).id,
      collection: transformedMediaSlug,
    })

    expect(restored).toMatchObject({ height: 600, width: 800 })
    expect(restored._transforms).toEqual({ crop: savedCrop })
  })

  test.options(
    'should clear transform state when restoring a version saved before it existed',
    { db: 'mongo' },
    async ({ payload }) => {
      const created = await createImage({ payload })

      await updateImage({
        id: created.id,
        data: { _transforms: { crop: { height: 400, width: 400, x: 0, y: 0 } }, alt: 'cropped' },
        payload,
      })

      const legacyVersion = await findVersionByAlt({ id: created.id, alt: 'source', payload })

      // Versions saved before `_transforms` existed have no key at all.
      await (payload.db as unknown as MongooseAdapter).versions[transformedMediaSlug]!.updateOne(
        { _id: legacyVersion.id },
        { $unset: { 'version._transforms': 1 } },
      )

      const restored = await payload.restoreVersion({
        id: legacyVersion.id,
        collection: transformedMediaSlug,
      })

      expect(restored).toMatchObject({ height: 1600, width: 1600 })
      expect(restored._transforms).toBeNull()
    },
  )

  test('should keep the cropped file and drop the crop when duplicating', async ({ payload }) => {
    const created = await createImage({
      payload,
      _transforms: {
        crop: { height: 600, width: 800, x: 100, y: 200 },
        focalPoint: { x: 20, y: 30 },
      },
    })

    // The copy is made from the cropped file, so the crop is already part of its files.
    const copy = await payload.duplicate({ id: created.id, collection: transformedMediaSlug })

    expect(copy).toMatchObject({ height: 600, width: 800 })
    expect(copy._transforms).toEqual({ focalPoint: { x: 20, y: 30 } })
  })

  test('should apply transform state to every document in a bulk update', async ({ payload }) => {
    // Different upload names: bulk updates of same-named files clash on main (a separate fix).
    const first = await createImage({ name: 'first.png', payload })
    const second = await createImage({ name: 'second.png', payload })

    const { docs } = await payload.update({
      collection: transformedMediaSlug,
      data: { _transforms: { crop: savedCrop } },
      where: { id: { in: [first.id, second.id] } },
    })

    expect(docs).toHaveLength(2)
    for (const doc of docs) {
      expect(doc).toMatchObject({ height: 600, width: 800 })
      expect(doc._transforms).toEqual({ crop: savedCrop })
    }
  })

  test('should keep the published transform state until a draft is published', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: draftMediaSlug,
      data: { _status: 'published', _transforms: { focalPoint: { x: 20, y: 30 } } },
      file: { name: 'draft.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const findTransforms = async ({ draft }: { draft?: boolean } = {}) =>
      (await payload.findByID({ id: created.id, collection: draftMediaSlug, draft }))._transforms

    await payload.update({
      id: created.id,
      collection: draftMediaSlug,
      data: { _transforms: { focalPoint: { x: 70, y: 80 } } },
      draft: true,
    })

    expect(await findTransforms()).toEqual({ focalPoint: { x: 20, y: 30 } })
    expect(await findTransforms({ draft: true })).toEqual({ focalPoint: { x: 70, y: 80 } })

    await payload.update({
      id: created.id,
      collection: draftMediaSlug,
      data: { _status: 'published' },
    })

    expect(await findTransforms()).toEqual({ focalPoint: { x: 70, y: 80 } })
  })

  test('should return transform state as JSON through GraphQL', async ({ payload, restClient }) => {
    const created = await createImage({ payload, _transforms: { focalPoint: { x: 20, y: 30 } } })

    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        // SQL IDs are numbers and MongoDB IDs are strings, so let JSON quote them as needed.
        query: `query { FileVersionedTransformedMedia(id: ${JSON.stringify(created.id)}) { _transforms } }`,
      }),
    })
    const { data, errors } = await response.json()

    expect(errors).toBeUndefined()
    expect(data.FileVersionedTransformedMedia._transforms).toEqual({ focalPoint: { x: 20, y: 30 } })
  })
})
