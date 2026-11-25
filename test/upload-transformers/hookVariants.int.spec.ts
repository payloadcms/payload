import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  recordedPosterOptions,
  recordedStageFileTypes,
  recordedVideoOnlyStageFileTypes,
  resetHookVariantRecords,
  stageOwnerCanTransformCalls,
} from './hookVariantFixtures.js'
import { hookVariantMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const videoPath = path.resolve(dirname, '../uploads/christmas-mariachi-in-guadalajara.mp4')
/** A one-frame WebM. No upload stage matches `video/webm`; only the `blur` hook owner does. */
const webmPath = path.resolve(dirname, 'clip.webm')
const imagePath = path.resolve(dirname, 'image.png')

test.suite('Upload variants hook', { config: './config.ts' }, () => {
  test.afterEach(() => {
    resetHookVariantRecords()
  })

  test('should store the video thumbnail that the hook owner makes', async ({ payload }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(doc.variants?.thumbnail).toMatchObject({
      height: 1600,
      mimeType: 'image/png',
      width: 1600,
    })
    expect(doc.variants?.thumbnail?.filename).toEqual(expect.any(String))
  })

  test('should combine the variants of two hook owners for one MIME type', async ({ payload }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(doc.variants?.thumbnail?.filename).toEqual(expect.any(String))
    expect(doc.variants?.blurhash?.filename).toEqual(expect.any(String))
  })

  test('should save a variant with no owner for the MIME type as null', async ({ payload }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(doc.variants?.card).toMatchObject({ filename: null, url: null })
  })

  test('should not keep an old variant when an image is replaced by a video', async ({
    payload,
  }) => {
    const image = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(imagePath),
      overrideAccess: true,
    })

    expect(image.variants?.card?.filename).toEqual(expect.any(String))

    const video = await payload.update({
      id: image.id,
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(video.variants?.card).toMatchObject({ filename: null, url: null })
  })

  test('should not keep old variants when no hook owner can transform the new video', async ({
    payload,
  }) => {
    const image = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(imagePath),
      overrideAccess: true,
    })

    expect(image.variants?.thumbnail?.filename).toEqual(expect.any(String))

    const video = await payload.update({
      id: image.id,
      collection: hookVariantMediaSlug,
      data: { blurBehaviour: 'ineligible', posterBehaviour: 'ineligible' },
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(video.variants).toMatchObject({
      blurhash: { filename: null, url: null },
      card: { filename: null, url: null },
      thumbnail: { filename: null, url: null },
    })
  })

  test('should keep Sharp as the owner for images on the same collection', async ({ payload }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(imagePath),
      overrideAccess: true,
    })

    expect(doc.variants?.thumbnail).toMatchObject({ height: 100, width: 100 })
    expect(doc.variants?.card).toMatchObject({ height: 300, width: 300 })
  })

  test('should save a skipped variant as null and keep the upload', async ({ payload }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: { posterBehaviour: 'skip' },
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(doc.mimeType).toBe('video/mp4')
    expect(doc.variants?.thumbnail).toMatchObject({ filename: null, url: null })
  })

  test('should fail the upload when the hook throws', async ({ payload }) => {
    await expect(
      payload.create({
        collection: hookVariantMediaSlug,
        data: { posterBehaviour: 'throw' },
        file: await getFileByPath(videoPath),
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'FileUploadError', status: 400 })
  })

  test('should store the hook variant when no upload stage matches the MIME type', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(webmPath),
      overrideAccess: true,
    })

    expect(doc.mimeType).toBe('video/webm')
    expect(doc.variants?.blurhash).toMatchObject({ mimeType: 'image/png' })
    expect(doc.variants?.blurhash?.filename).toEqual(expect.any(String))
  })

  test('should save the variant as null when the hook owner cannot transform the file', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: { posterBehaviour: 'ineligible' },
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(recordedPosterOptions).toEqual([])
    expect(doc.variants?.thumbnail).toMatchObject({ filename: null, url: null })
  })

  test("should pass the options from the hook owner's canTransform to transformVariant", async ({
    payload,
  }) => {
    await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(recordedPosterOptions).toEqual([{ frame: 1 }])
  })

  test('should run the later eligible stages on each variant', async ({ payload }) => {
    await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(recordedStageFileTypes).toEqual(['video/mp4', 'image/png', 'image/png'])
  })

  test('should not run a stage for videos on a PNG variant', async ({ payload }) => {
    await payload.create({
      collection: hookVariantMediaSlug,
      data: {},
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(recordedVideoOnlyStageFileTypes).toEqual(['video/mp4'])
  })

  test('should call canTransform once for a main-file stage that also makes variants with the hook', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: hookVariantMediaSlug,
      data: { hasStageOwner: true },
      file: await getFileByPath(videoPath),
      overrideAccess: true,
    })

    expect(doc.variants?.preview?.filename).toEqual(expect.any(String))
    expect(stageOwnerCanTransformCalls.count).toBe(1)
  })

  test('should log the error when the hook throws', async ({ payload }) => {
    const loggedError = vi.spyOn(payload.logger, 'error')

    try {
      await expect(
        payload.create({
          collection: hookVariantMediaSlug,
          data: { posterBehaviour: 'throw' },
          file: await getFileByPath(videoPath),
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ name: 'FileUploadError' })

      expect(loggedError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'poster: cannot read this video' }),
      )
    } finally {
      loggedError.mockRestore()
    }
  })
})
