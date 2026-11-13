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
import {
  convertedMediaDir,
  convertedMediaSlug,
  draftMediaDir,
  draftMediaSlug,
  flipStagePlannedMimeTypes,
  flipStageRuns,
  transformedMediaDir,
  transformedMediaSlug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 1600 x 1600 PNG
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const savedCrop = { height: 600, width: 800, x: 0, y: 0 }

// A path read from the collection's own folder, so the test does not fetch over the network.
const toLocalPath = (url?: null | string) => new URL(url!, 'http://payload.local').pathname

test.suite('File transform state', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(transformedMediaDir, { force: true, recursive: true })
    await rm(convertedMediaDir, { force: true, recursive: true })
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
      data: { _transforms, alt: 'source' },
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

  const withCrop = (change: object) => ({ crop: { ...savedCrop, ...change } })

  test.for([
    { name: 'a crop outside the original', key: 'crop', value: withCrop({ x: 1000 }) },
    { name: 'a crop with non-integer pixels', key: 'crop', value: withCrop({ width: 800.5 }) },
    { name: 'a crop with zero size', key: 'crop', value: withCrop({ height: 0 }) },
    { name: 'a focal point above 100', key: 'focalPoint', value: { focalPoint: { x: 120, y: 1 } } },
    {
      name: 'a value of the wrong type',
      key: 'focalPoint.x',
      value: { focalPoint: { x: '3', y: 1 } },
    },
    { name: 'a custom key that is not a finite number', key: 'score', value: { score: NaN } },
    { name: 'a nested non-finite custom value', key: 'a.b', value: { a: { b: Infinity } } },
    { name: 'a custom key that is not JSON', key: 'id', value: { id: BigInt(1) } },
  ])('should reject $name and name the failing key', async ({ key, value }, { payload }) => {
    await expect(
      createImage({ _transforms: value as UploadTransforms, payload }),
    ).rejects.toMatchObject({
      data: {
        errors: [
          expect.objectContaining({
            message: expect.stringContaining(key),
            path: `_transforms.${key.split('.')[0]}`,
          }),
        ],
      },
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
    const { doc } = await response.json()

    expect(doc).toMatchObject({ focalX: 30, focalY: 60, height: 800, width: 400 })
    expect(doc._transforms).toEqual({
      crop: { height: 800, width: 400, x: 160, y: 320 },
      focalPoint: { x: 30, y: 60 },
    })
  })

  test.for([
    { name: 'a saved crop', data: { _transforms: { crop: savedCrop } }, query: {} },
    {
      name: 'an admin crop',
      data: {},
      query: {
        uploadEdits: {
          crop: { height: 37.5, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 600,
          widthInPixels: 800,
        },
      },
    },
  ])(
    'should check and apply $name on a create from a URL, after the file is read',
    async ({ data, query }, { payload }) => {
      const source = await createImage({ payload })

      const created = await payload.create({
        collection: transformedMediaSlug,
        data: { ...data, filename: source.filename, url: toLocalPath(source.url) },
        // Keeps the URL in the data, so the file is read from the collection's own folder.
        overrideAccess: true,
        req: { query },
      })

      expect(created).toMatchObject({ height: 600, width: 800 })
      expect(created._transforms).toEqual({ crop: savedCrop })
    },
  )

  test('should crop the main file, and crop from the original when the saved crop changes', async ({
    payload,
  }) => {
    const created = await createImage({
      _transforms: { crop: { height: 800, width: 800, x: 400, y: 400 } },
      payload,
    })

    expect(created).toMatchObject({
      height: 800,
      original: { height: 1600, width: 1600 },
      width: 800,
    })

    // Larger than the first crop: only possible when the source is the original.
    const updated = await updateImage({
      id: created.id,
      data: { _transforms: { crop: { height: 1200, width: 1200, x: 0, y: 0 } } },
      payload,
    })

    expect(updated).toMatchObject({ height: 1200, width: 1200 })
    await expect(
      sharp(path.join(transformedMediaDir, updated.filename!)).metadata(),
    ).resolves.toMatchObject({ height: 1200, width: 1200 })
  })

  test('should serve the original again when the saved crop is removed', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await createImage({ _transforms: { crop: savedCrop }, payload })

    const updated = await updateImage({ id: created.id, data: { _transforms: null }, payload })

    expect(updated).toMatchObject({ _transforms: null, height: 1600, width: 1600 })
    expect(updated.filename).toBe(updated.original?.filename)
    expect(await readFile(path.join(transformedMediaDir, updated.filename!))).toEqual(bytes)
  })

  test('should plan a rebuild with the fields of the original, not of the converted main file', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: convertedMediaSlug,
      data: { alt: 'converted' },
      file: { name: 'converted.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    flipStagePlannedMimeTypes.length = 0

    await payload.update({
      id: created.id,
      collection: convertedMediaSlug,
      data: { _transforms: { flip: { horizontal: true } } },
    })

    expect(created.mimeType).toBe('image/jpeg')
    expect(flipStagePlannedMimeTypes).toEqual(['image/png'])
  })

  test('should cut image sizes around the saved focal point', async ({ payload }) => {
    // Red on the left half, blue on the right half. The `small` size is 200 x 200, so a cut around
    // a focal point at x = 90 is all blue, and a cut from the center starts on red.
    const half = { channels: 3, height: 200, width: 200 } as const
    const bytes = await sharp({ create: { ...half, background: '#ff0000', width: 400 } })
      .composite([{ input: { create: { ...half, background: '#0000ff' } }, left: 200, top: 0 }])
      .png()
      .toBuffer()

    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { _transforms: { focalPoint: { x: 90, y: 50 } } },
      file: { name: 'halves.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    const small = await sharp(
      await readFile(path.join(transformedMediaDir, created.variants!.small!.filename!)),
    )
      .raw()
      .toBuffer({ resolveWithObject: true })

    expect([...small.data.subarray(0, 3)]).toEqual([0, 0, 255])
  })

  test('should keep the saved crop when only the focal point changes', async ({ payload }) => {
    const created = await createImage({ _transforms: { crop: savedCrop }, payload })

    const updated = await updateImage({ id: created.id, data: { focalX: 75, focalY: 25 }, payload })

    expect(updated).toMatchObject({ height: 600, width: 800 })
    expect(updated._transforms).toEqual({ crop: savedCrop, focalPoint: { x: 75, y: 25 } })
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

  const findSourceVersion = async ({ id, payload }: { id: number | string; payload: Payload }) =>
    (
      await payload.findVersions({
        collection: transformedMediaSlug,
        where: { parent: { equals: id } },
      })
    ).docs.find(({ version }) => version.alt === 'source')!

  test('should restore the crop that belongs to the restored version', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { crop: savedCrop } })

    await updateImage({
      id: created.id,
      data: { _transforms: { crop: { height: 400, width: 400, x: 0, y: 0 } }, alt: 'second crop' },
      payload,
    })

    const restored = await payload.restoreVersion({
      id: (await findSourceVersion({ id: created.id, payload })).id,
      collection: transformedMediaSlug,
    })

    expect(restored).toMatchObject({ height: 600, width: 800 })
    expect(restored._transforms).toEqual({ crop: savedCrop })
  })

  test('should reject a crop outside the version original on a draft restore, which skips field validation', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: draftMediaSlug,
      data: { _status: 'published', _transforms: { crop: savedCrop } },
      file: { name: 'draft.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const [version] = (
      await payload.findVersions({
        collection: draftMediaSlug,
        where: { parent: { equals: created.id } },
      })
    ).docs

    // The version's crop no longer fits its original, for example after a manual data change.
    await payload.db.updateVersion({
      id: version!.id,
      collection: draftMediaSlug,
      versionData: { version: { ...version!.version, _transforms: withCrop({ x: 1000 }) } },
    })

    await expect(
      payload.restoreVersion({ id: version!.id, collection: draftMediaSlug, draft: true }),
    ).rejects.toMatchObject({ data: { errors: [{ path: '_transforms.crop' }] }, status: 400 })
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

      const legacyVersion = await findSourceVersion({ id: created.id, payload })

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
    const focalPoint = { x: 20, y: 30 }
    const created = await createImage({ _transforms: { crop: savedCrop, focalPoint }, payload })

    // The copy is made from the cropped file, so the crop is already part of its files.
    const copy = await payload.duplicate({ id: created.id, collection: transformedMediaSlug })

    expect(copy).toMatchObject({ height: 600, width: 800 })
    expect(copy._transforms).toEqual({ focalPoint })
  })

  test('should keep the saved crop when another claimed key rebuilds the file', async ({
    payload,
  }) => {
    const created = await createImage({ payload, _transforms: { crop: savedCrop } })

    const updated = await updateImage({
      id: created.id,
      data: { _transforms: { crop: savedCrop, flip: { horizontal: true } } },
      payload,
    })

    await expect(
      sharp(path.join(transformedMediaDir, updated.filename!)).metadata(),
    ).resolves.toMatchObject({ height: 600, width: 800 })
  })

  test('should not apply claimed keys again when duplicating', async ({ payload }) => {
    const created = await createImage({ payload, _transforms: { flip: { horizontal: true } } })
    flipStageRuns.length = 0

    // The copy is made from the flipped file, so the flip is already part of its files.
    const copy = await payload.duplicate({ id: created.id, collection: transformedMediaSlug })

    // The stage ran for the copy, and saw no flip each time, in doc or in originalDoc.
    expect(new Set(flipStageRuns)).toEqual(new Set([undefined]))
    expect(copy._transforms).toBeNull()
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

  test('should return transform state, with custom keys, as JSON through GraphQL', async ({
    payload,
    restClient,
  }) => {
    const saved = { focalPoint: { x: 20, y: 30 }, watermark: { opacity: 0.5, position: 'bottom' } }
    const created = await createImage({ payload, _transforms: saved })

    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        // SQL IDs are numbers and MongoDB IDs are strings, so let JSON quote them as needed.
        query: `query { FileVersionedTransformedMedia(id: ${JSON.stringify(created.id)}) { _transforms } }`,
      }),
    })
    const { data } = await response.json()

    expect(data.FileVersionedTransformedMedia._transforms).toEqual(saved)
  })
})
