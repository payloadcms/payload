import type { Payload } from 'payload'

import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const createdIDs: (number | string)[] = []
const tempFiles: string[] = []

const jpegFixtureWithExif = async (): Promise<string> => {
  const buffer = await sharp({
    create: {
      background: { b: 0, g: 0, r: 255 },
      channels: 3,
      height: 8,
      width: 8,
    },
  })
    // sharp 0.32.6 has no `withExif` (that arrived in 0.33+); use `withMetadata({ exif })`.
    .withMetadata({ exif: { IFD0: { Make: 'TestCam', Model: 'X100' } } })
    .jpeg()
    .toBuffer()

  const filePath = path.join(tmpdir(), `plugin-exif-fixture-${tempFiles.length}.jpg`)
  await writeFile(filePath, buffer)
  tempFiles.push(filePath)

  return filePath
}

describe('@payloadcms/plugin-exif', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    for (const id of createdIDs) {
      await payload.delete({ id, collection: 'media' })
    }
    for (const file of tempFiles) {
      await rm(file, { force: true })
    }
    await payload.destroy()
  })

  it('should extract and store exif metadata on upload', async () => {
    const filePath = await jpegFixtureWithExif()

    const doc = await payload.create({
      collection: 'media',
      data: {},
      filePath,
    })
    createdIDs.push(doc.id)

    // Make/model are queried through the raw JSON, not a promoted field.
    expect(doc.exif?.raw).toMatchObject({ Make: 'TestCam', Model: 'X100' })
  })

  it('should leave exif empty for an image without metadata', async () => {
    const buffer = await sharp({
      create: {
        background: { b: 0, g: 0, r: 0 },
        channels: 3,
        height: 8,
        width: 8,
      },
    })
      .jpeg()
      .toBuffer()
    const filePath = path.join(tmpdir(), `plugin-exif-noexif-${tempFiles.length}.jpg`)
    await writeFile(filePath, buffer)
    tempFiles.push(filePath)

    const doc = await payload.create({
      collection: 'media',
      data: {},
      filePath,
    })
    createdIDs.push(doc.id)

    expect(doc.exif?.raw ?? null).toBeNull()
  })
})
