import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { FIVE_GIB_BYTES } from '../../../packages/storage-s3/src/constants.js'
import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { clearTestBucket, createTestBucket, MB } from '../test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const signedURLEndpoint = '/storage-s3-generate-signed-url'

let restClient: NextRESTClient
let payload: Payload

describe('@payloadcms/storage-s3 clientUploads with raised file size limit', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await createTestBucket()
    await clearTestBucket()
  })

  it('should initiate multipart upload for files larger than 5 GiB when upload.limits.fileSize allows it', async () => {
    const filesize = FIVE_GIB_BYTES + MB(1)

    const response = await restClient.POST(signedURLEndpoint, {
      body: JSON.stringify({
        action: 'initiateMultipart',
        collectionSlug: 'media',
        filename: 'large-multipart-initiate.bin',
        filesize,
        mimeType: 'application/octet-stream',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.action).toBe('initiateMultipart')
    expect(body.ok).toBe(true)
    expect(body.key).toContain('large-multipart-initiate.bin')
    expect(body.partCount).toBeGreaterThan(1)
    expect(body.uploadId).toBeDefined()
  })

  it('should sign and upload the first multipart part for files larger than 5 GiB', async () => {
    const filesize = FIVE_GIB_BYTES + MB(1)

    const initiate = await restClient
      .POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'initiateMultipart',
          collectionSlug: 'media',
          filename: 'large-multipart-part.bin',
          filesize,
          mimeType: 'application/octet-stream',
        }),
      })
      .then((res) =>
        res.json<{
          key: string
          partSize: number
          uploadId: string
        }>(),
      )

    const partSign = await restClient
      .POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'signMultipartPart',
          collectionSlug: 'media',
          key: initiate.key,
          partNumber: 1,
          uploadId: initiate.uploadId,
        }),
      })
      .then((res) => res.json<{ url: string }>())

    const chunk = Buffer.alloc(initiate.partSize, 1)
    const uploadResponse = await fetch(partSign.url, {
      body: chunk,
      method: 'PUT',
    })

    expect(uploadResponse.ok).toBe(true)
    expect(uploadResponse.headers.get('etag')).toBeDefined()

    await restClient.POST(signedURLEndpoint, {
      body: JSON.stringify({
        action: 'abortMultipart',
        collectionSlug: 'media',
        key: initiate.key,
        uploadId: initiate.uploadId,
      }),
    })
  })

  afterEach(async () => {
    await clearTestBucket()
  })

  afterAll(async () => {
    await payload.destroy()
  })
})
