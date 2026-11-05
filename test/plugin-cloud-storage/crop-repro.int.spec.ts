import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { cropMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('plugin-cloud-storage crop re-entry', () => {
  const createdIDs: (number | string)[] = []

  let payload: Payload

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, 'plugin-cloud-storage', true, 'config.crop.ts'))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of createdIDs) {
      try {
        await payload.delete({ id, collection: cropMediaSlug })
      } catch (_) {
        // Ignore
      }
    }
    createdIDs.length = 0
  })

  it('should not re-process the file when persisting adapter metadata after a crop', async () => {
    const imagePath = path.resolve(dirname, '../uploads/image.png')
    const doc = await payload.create({
      collection: cropMediaSlug,
      data: {},
      filePath: imagePath,
      req: {
        query: {
          uploadEdits: {
            crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
            focalPoint: { height: 100, unit: '%', width: 100, x: 50, y: 50 },
            heightInPixels: 1200,
            widthInPixels: 1200,
          },
        },
      },
    })

    createdIDs.push(doc.id)

    expect(doc.id).toBeTruthy()
    expect(doc.s3URL).toContain('fake-bucket.example.com')
  })
})
