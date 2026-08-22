import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { kitchenSinkMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

describe('Kitchen sink Sharp transformer', () => {
  const docIDs: (number | string)[] = []

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of docIDs) {
      await payload.delete({ id, collection: kitchenSinkMediaSlug as CollectionSlug })
    }
    docIDs.length = 0
  })

  const uploadFixture = async (fixtureFilename: string) => {
    const filePath = path.resolve(dirname, `./${fixtureFilename}`)
    const file = await getFileByPath(filePath)
    const doc = await payload.create({
      collection: kitchenSinkMediaSlug as CollectionSlug,
      data: {},
      file,
    })
    docIDs.push(doc.id)
    return doc as unknown as { filename: string; id: number | string }
  }

  it('should serve the original image unchanged when no recognized query parameter is present', async () => {
    const doc = await uploadFixture('image.png')

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}`)

    expect(response.status).toBe(200)
    const sourceMetadata = await sharp(path.resolve(dirname, './image.png')).metadata()
    const outputMetadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    expect(outputMetadata.width).toBe(sourceMetadata.width)
    expect(outputMetadata.height).toBe(sourceMetadata.height)
  })

  it('should flip the image vertically', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).flip().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?flip`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should flop the image horizontally', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).flop().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?flop`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should rotate the image by an arbitrary angle, swapping dimensions for 90 degrees', async () => {
    const doc = await uploadFixture('small.png') // 320x80

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?rotate=90`)

    expect(response.status).toBe(200)
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    expect(metadata.width).toBe(80)
    expect(metadata.height).toBe(320)
  })

  it('should convert the image to grayscale', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).grayscale().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?grayscale`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should rotate the color hue', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png'))
      .modulate({ hue: 180 })
      .toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?hue=180`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should adjust brightness and saturation together via modulate', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png'))
      .modulate({ brightness: 1.5, saturation: 0.5 })
      .toBuffer()

    const response = await restClient.GET(
      `/${kitchenSinkMediaSlug}/file/${doc.filename}?brightness=1.5&saturation=0.5`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should negate (invert) the image colors', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).negate().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?negate`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should apply a gamma correction', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).gamma(2.2).toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?gamma=2.2`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should normalize contrast', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).normalize().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?normalize`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should apply a median filter', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).median(3).toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?median=3`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should apply a gaussian blur', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).blur(5).toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?blur=5`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should sharpen the image', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png')).sharpen().toBuffer()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?sharpen`)

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should threshold the image to pure black and white', async () => {
    const doc = await uploadFixture('image.png')

    const response = await restClient.GET(
      `/${kitchenSinkMediaSlug}/file/${doc.filename}?threshold=128`,
    )

    expect(response.status).toBe(200)
    const { data, info } = await sharp(Buffer.from(await response.arrayBuffer()))
      .raw()
      .toBuffer({ resolveWithObject: true })
    const uniqueValues = new Set(data)
    // Thresholding collapses every pixel to pure black or pure white.
    expect([...uniqueValues].every((value) => value === 0 || value === 255)).toBe(true)
    expect(info.width).toBeGreaterThan(0)
  })

  it('should tint the image toward the requested color', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png'))
      .tint({ b: 0, g: 102, r: 255 })
      .toBuffer()

    const response = await restClient.GET(
      `/${kitchenSinkMediaSlug}/file/${doc.filename}?tint=ff6600`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should chain multiple operations together in a single request', async () => {
    const doc = await uploadFixture('image.png')
    const expected = await sharp(path.resolve(dirname, './image.png'))
      .flip()
      .grayscale()
      .negate()
      .toBuffer()

    const response = await restClient.GET(
      `/${kitchenSinkMediaSlug}/file/${doc.filename}?flip&grayscale&negate`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(expected)
  })

  it('should never persist dynamic output: the stored file is unaffected by a transform request', async () => {
    const doc = await uploadFixture('image.png')
    const sourceMetadataBefore = await sharp(path.resolve(dirname, './image.png')).metadata()

    const response = await restClient.GET(`/${kitchenSinkMediaSlug}/file/${doc.filename}?grayscale`)
    expect(response.status).toBe(200)

    const storedFilePath = path.resolve(dirname, './media', doc.filename)
    const storedMetadata = await sharp(storedFilePath).metadata()
    expect(storedMetadata.width).toBe(sourceMetadataBefore.width)
    expect(storedMetadata.space).not.toBe('b-w')
  })
})
