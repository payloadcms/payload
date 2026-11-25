import type { PayloadRequest, ReservedObject } from 'payload'

import { S3 } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'

import { createSegmentedUpload } from './segmentedUpload.js'

const object: ReservedObject = {
  _objectKey: 'key',
  filename: 'video.mp4',
  prefix: '',
  storageFilePath: 'key/video.mp4',
}

const providerState = { uploadId: 'upload' }

const req = {} as PayloadRequest

/**
 * Runs the real S3 client against a stubbed response, so errors carry the names and metadata the
 * SDK gives them. S3 answers HEAD with a status and headers only, never a body.
 */
const createCapability = ({
  headers = {},
  statusCode,
}: {
  headers?: Record<string, string>
  statusCode: number
}) => {
  const client = new S3({
    credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
    maxAttempts: 1,
    region: 'us-east-1',
    requestHandler: {
      handle: () => Promise.resolve({ response: { body: Readable.from([]), headers, statusCode } }),
    },
  })

  return createSegmentedUpload({
    bucket: 'bucket',
    collectionPrefix: '',
    getStorageClient: () => client,
  })
}

describe('S3 segmented uploads', () => {
  it('should report the size of a committed object', async () => {
    const capability = createCapability({ headers: { 'content-length': '10' }, statusCode: 200 })

    await expect(capability.getStoredSize!({ object, providerState, req })).resolves.toBe(10)
  })

  it('should report nothing stored when the object does not exist', async () => {
    const capability = createCapability({ statusCode: 404 })

    await expect(capability.getStoredSize!({ object, providerState, req })).resolves.toBeNull()
  })

  it('should report nothing stored when credentials without s3:ListBucket get a 403', async () => {
    const capability = createCapability({ statusCode: 403 })

    await expect(capability.getStoredSize!({ object, providerState, req })).resolves.toBeNull()
  })

  it('should throw when S3 fails for another reason', async () => {
    const capability = createCapability({ statusCode: 500 })

    await expect(capability.getStoredSize!({ object, providerState, req })).rejects.toMatchObject({
      $metadata: { httpStatusCode: 500 },
    })
  })
})
