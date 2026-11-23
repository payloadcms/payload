import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'

import { getFile } from './getFile.js'

const createPendingDownload = () => {
  const nodeStream = new PassThrough()
  const client = {
    bucket: () => ({
      file: () => ({
        createReadStream: () => nodeStream,
        getMetadata: vi.fn(async () => [{ contentType: 'image/png', etag: 'etag', size: 4 }]),
      }),
    }),
  }

  return { client, nodeStream }
}

const getTransformSource = ({
  client,
  signal,
}: {
  client: ReturnType<typeof createPendingDownload>['client']
  signal?: AbortSignal
}) =>
  getFile({
    bucket: 'bucket',
    client: client as never,
    collection: { fields: [], slug: 'media', upload: {} } as never,
    doc: { id: 'doc', prefix: 'media' },
    filename: 'original.png',
    operation: 'transform',
    req: {
      headers: new Headers(),
      payload: { logger: { error: vi.fn() } },
      signal,
    } as never,
  })

describe('getFile stream cleanup', () => {
  it('should destroy the GCS read stream when the response body is cancelled', async () => {
    const { client, nodeStream } = createPendingDownload()

    const response = await getTransformSource({ client })
    await response.body!.cancel()

    expect(nodeStream.destroyed).toBe(true)
  })

  it('should destroy the GCS read stream when the request is aborted', async () => {
    const { client, nodeStream } = createPendingDownload()
    const abortController = new AbortController()

    const response = await getTransformSource({ client, signal: abortController.signal })
    const reader = response.body!.getReader()
    abortController.abort()

    expect(nodeStream.destroyed).toBe(true)
    await expect(reader.read()).rejects.toThrow()
  })

  it('should stream the file when it is read to the end', async () => {
    const { client, nodeStream } = createPendingDownload()

    const response = await getTransformSource({ client })
    nodeStream.end(Buffer.from('file'))

    expect(await response.text()).toBe('file')
  })
})
