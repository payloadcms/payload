import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { mediaSlug } from './shared.js'
import { clearTestBucket, createTestBucket, verifyUploads } from './test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('Search plugin before S3 - Issue #15431', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(
      dirname,
      'storage-s3-search-before',
      true,
      'searchBeforeS3.config.ts',
    ))
    await createTestBucket()
    await clearTestBucket()
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await payload.delete({
      collection: mediaSlug,
      where: { id: { exists: true } },
    })
    // Only delete from search if the collection exists
    if (payload.collections['search']) {
      await payload.delete({
        collection: 'search',
        where: { id: { exists: true } },
      })
    }
    await clearTestBucket()
  })

  it('should upload all image sizes to S3 when search plugin is listed before S3 plugin', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    expect(upload.filename).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaSlug,
      uploadId: upload.id,
      payload,
    })
  })

  it('should create search document when uploading media', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    const { docs: searchDocs } = await payload.find({
      collection: 'search',
      where: {
        'doc.value': { equals: upload.id },
        'doc.relationTo': { equals: mediaSlug },
      },
    })

    expect(searchDocs.length).toBe(1)
  })
})
