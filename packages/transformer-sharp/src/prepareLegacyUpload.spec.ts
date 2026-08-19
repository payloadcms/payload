import type { UploadEdits } from 'payload'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig } from './types.js'

import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'

const makeImageBuffer = async ({
  background = { b: 0, g: 128, r: 255 },
  format = 'png' as const,
  height,
  width,
}: {
  background?: { b: number; g: number; r: number }
  format?: 'gif' | 'png' | 'webp'
  height: number
  width: number
}): Promise<Buffer> =>
  sharp({ create: { background, channels: 3, height, width } })
    .toFormat(format)
    .toBuffer()

const makePrepareUpload = (collections: Partial<Record<string, SharpCollectionConfig>> = {}) =>
  createPrepareLegacyUpload({ collections, sharpDependency: sharp })

describe('createPrepareLegacyUpload', () => {
  it('should omit height and width when the file type does not support resizing', async () => {
    const file = new File([Buffer.from('not-an-image')], 'doc.pdf', { type: 'application/pdf' })
    const transform = vi.fn().mockResolvedValue(file)

    const results = await makePrepareUpload()({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits: {},
    })

    expect(results).toEqual([{ fieldPath: 'filename', file, mimeType: 'application/pdf' }])
    expect(transform).toHaveBeenCalledTimes(1)
    expect(transform).toHaveBeenCalledWith({
      fieldPath: 'filename',
      options: { collectionUpload: {}, crop: undefined, kind: 'main' },
    })
  })

  it('should treat an image file whose dimensions cannot be probed like a non-resizable file', async () => {
    const file = new File([Buffer.from('this is not valid image data')], 'broken.png', {
      type: 'image/png',
    })
    const transform = vi.fn().mockResolvedValue(file)

    const results = await makePrepareUpload()({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits: {},
    })

    expect(results).toEqual([{ fieldPath: 'filename', file, mimeType: 'image/png' }])
  })

  it('should probe and report height/width for a resizable file with no crop or sizes configured', async () => {
    const buffer = await makeImageBuffer({ height: 200, width: 400 })
    const file = new File([buffer], 'photo.png', { type: 'image/png' })
    const transform = vi.fn().mockResolvedValue(file)

    const results = await makePrepareUpload()({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits: {},
    })

    expect(results).toEqual([
      { fieldPath: 'filename', file, height: 200, mimeType: 'image/png', width: 400 },
    ])
  })

  it("should pass crop options to transform, using the file's probed original dimensions", async () => {
    const buffer = await makeImageBuffer({ height: 200, width: 400 })
    const file = new File([buffer], 'photo.png', { type: 'image/png' })
    const transform = vi.fn().mockResolvedValue(file)

    const uploadEdits: UploadEdits = {
      crop: { height: 50, unit: '%', width: 80, x: 10, y: 20 },
      heightInPixels: 100,
      widthInPixels: 320,
    }

    await makePrepareUpload()({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits,
    })

    expect(transform).toHaveBeenCalledWith({
      fieldPath: 'filename',
      options: {
        collectionUpload: {},
        crop: {
          cropData: uploadEdits.crop,
          heightInPixels: 100,
          originalDimensions: { height: 200, width: 400 },
          widthInPixels: 320,
        },
        kind: 'main',
      },
    })
  })

  it('should not pass crop options when the file type does not support resizing, even if uploadEdits contains crop data', async () => {
    const file = new File([Buffer.from('not-an-image')], 'doc.pdf', { type: 'application/pdf' })
    const transform = vi.fn().mockResolvedValue(file)

    const uploadEdits: UploadEdits = {
      crop: { height: 50, unit: '%', width: 80, x: 10, y: 20 },
      heightInPixels: 100,
      widthInPixels: 320,
    }

    await makePrepareUpload()({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits,
    })

    expect(transform).toHaveBeenCalledWith({
      fieldPath: 'filename',
      options: { collectionUpload: {}, crop: undefined, kind: 'main' },
    })
  })

  it('should describe a resized image size and omit a size that would enlarge the original', async () => {
    const buffer = await makeImageBuffer({ height: 100, width: 200 })
    const file = new File([buffer], 'photo.png', { type: 'image/png' })

    const thumbBuffer = await makeImageBuffer({ height: 50, width: 50 })
    const thumbFile = new File([thumbBuffer], 'photo-thumb.png', { type: 'image/png' })

    const transform = vi.fn(async (task: { fieldPath: string }) =>
      task.fieldPath === 'sizes.thumb' ? thumbFile : file,
    )

    const collections: Partial<Record<string, SharpCollectionConfig>> = {
      media: {
        imageSizes: [
          { name: 'thumb', height: 50, width: 50 },
          // Exceeds the 200x100 original with withoutEnlargement at its default —
          // getImageResizeAction omits this size entirely.
          { name: 'tooLargeToEnlarge', height: 9000, width: 9000 },
        ],
      },
    }

    const results = await makePrepareUpload(collections)({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits: {},
    })

    expect(results).toEqual([
      { fieldPath: 'filename', file, height: 100, mimeType: 'image/png', width: 200 },
      { fieldPath: 'sizes.thumb', file: thumbFile, height: 50, mimeType: 'image/png', width: 50 },
      { fieldPath: 'sizes.tooLargeToEnlarge' },
    ])
    // The omitted size never reaches transform — only main + "thumb" do.
    expect(transform).toHaveBeenCalledTimes(2)
  })

  it('should pass a rounded focal point to transform when the resize action requires one', async () => {
    const buffer = await makeImageBuffer({ height: 100, width: 200 })
    const file = new File([buffer], 'photo.png', { type: 'image/png' })
    const thumbFile = new File([await makeImageBuffer({ height: 50, width: 50 })], 'thumb.png', {
      type: 'image/png',
    })

    const transform = vi.fn(async (task: { fieldPath: string }) =>
      task.fieldPath === 'sizes.thumb' ? thumbFile : file,
    )

    const collections: Partial<Record<string, SharpCollectionConfig>> = {
      media: { imageSizes: [{ name: 'thumb', height: 50, width: 50 }] },
    }

    await makePrepareUpload(collections)({
      collectionSlug: 'media',
      file,
      transform,
      uploadEdits: { focalPoint: { x: 30.4, y: 70.6 } },
    })

    expect(transform).toHaveBeenCalledWith({
      fieldPath: 'sizes.thumb',
      options: {
        collectionUpload: collections.media,
        focalPoint: { x: 30, y: 71 },
        imageResizeConfig: { name: 'thumb', height: 50, width: 50 },
        kind: 'size',
        originalDimensions: { height: 100, width: 200 },
      },
    })
  })
})
