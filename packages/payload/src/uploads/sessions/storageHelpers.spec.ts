import type { ReservedObject } from './types.js'

import { describe, expect, it } from 'vitest'

import { APIError } from '../../errors/APIError.js'
import {
  getStagedPartNumber,
  getStagedPartPath,
  getUploadStagingPath,
  mapWithConcurrency,
  toReservedObject,
  withPermanentStorageErrors,
} from './storageHelpers.js'

const object: ReservedObject = {
  _objectKey: 'key',
  filename: 'video.mp4',
  prefix: 'media',
  storageFilePath: 'media/key/video.mp4',
}

describe('upload session storage helpers', () => {
  it('should build the reserved object from a resolved upload key', () => {
    expect(
      toReservedObject({
        sanitizedFilename: 'video.mp4',
        storageFilePath: 'media/key/video.mp4',
        uploadReference: { _objectKey: 'key', prefix: 'media' },
      }),
    ).toEqual(object)
  })

  it('should refuse a resolved upload key without an object key', () => {
    expect(() =>
      toReservedObject({
        sanitizedFilename: 'video.mp4',
        storageFilePath: 'media/video.mp4',
        uploadReference: { prefix: 'media' },
      }),
    ).toThrow('could not be reserved')
  })

  it('should stage parts beneath the staging path of their object', () => {
    expect(getUploadStagingPath({ object })).toBe('payload-upload-sessions/media/key/video.mp4')
    expect(getStagedPartPath({ number: 12, object })).toBe(
      'payload-upload-sessions/media/key/video.mp4/00012',
    )
  })

  it.each([0, 100_000, 1.5])('should refuse to stage part number %s', (number) => {
    expect(() => getStagedPartPath({ number, object })).toThrow('cannot be staged')
  })

  it('should read part numbers back and ignore other paths', () => {
    const stagingPath = getUploadStagingPath({ object })

    expect(getStagedPartNumber({ object, path: getStagedPartPath({ number: 7, object }) })).toBe(7)
    expect(getStagedPartNumber({ object, path: `${stagingPath}/00000` })).toBeNull()
    expect(getStagedPartNumber({ object, path: `${stagingPath}/7` })).toBeNull()
    expect(getStagedPartNumber({ object, path: `${stagingPath}/compose-1` })).toBeNull()
    expect(getStagedPartNumber({ object, path: `${stagingPath}-other/00001` })).toBeNull()
  })

  it('should turn a permanent storage fault into a 4xx API error', async () => {
    const fault = Object.assign(new Error('denied'), { name: 'AccessDenied' })

    const error = await withPermanentStorageErrors({
      getPermanentStatus: () => 403,
      operation: () => Promise.reject(fault),
    }).catch((err: unknown) => err)

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).status).toBe(403)
    expect((error as APIError).message).toBe('Storage rejected the upload (AccessDenied).')
  })

  it('should rethrow a temporary storage fault unchanged', async () => {
    const fault = new Error('timeout')

    await expect(
      withPermanentStorageErrors({
        getPermanentStatus: () => null,
        operation: () => Promise.reject(fault),
      }),
    ).rejects.toBe(fault)
  })

  it('should keep results in order while running at most the given number at once', async () => {
    let running = 0
    let maximumRunning = 0

    const results = await mapWithConcurrency({
      concurrency: 2,
      items: [30, 10, 20, 5],
      mapper: async (delay) => {
        running++
        maximumRunning = Math.max(maximumRunning, running)
        await new Promise((resolve) => setTimeout(resolve, delay))
        running--

        return delay * 2
      },
    })

    expect(results).toEqual([60, 20, 40, 10])
    expect(maximumRunning).toBe(2)
  })

  it('should start no new items after one fails', async () => {
    const started: number[] = []

    await expect(
      mapWithConcurrency({
        concurrency: 2,
        items: [1, 2, 3, 4, 5, 6],
        mapper: async (item) => {
          started.push(item)
          await new Promise((resolve) => setTimeout(resolve, 5))

          if (item === 1) {
            throw new Error('part failed')
          }

          return item
        },
      }),
    ).rejects.toThrow('part failed')
    expect(started).toEqual([1, 2])
  })
})
