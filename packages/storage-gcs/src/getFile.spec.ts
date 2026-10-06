import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'

import { createGcsAdapter } from './adapter.js'

const createStaticHandler = (nodeStream: Readable) => {
  const fileImpl = {
    createReadStream: vi.fn(() => nodeStream),
    getMetadata: vi.fn(async () => [{ contentType: 'image/png', etag: 'etag-1', size: 5 }]),
  }
  const file = vi.fn(() => fileImpl)
  const adapter = createGcsAdapter({
    bucket: 'bucket',
    getStorageClient: () => ({ bucket: () => ({ file }) }) as never,
  })
  const generatedAdapter = adapter({
    collection: {
      fields: [],
      slug: 'media',
      upload: {},
    },
    prefix: 'media',
  })

  return {
    createReadStream: fileImpl.createReadStream,
    staticHandler: (reqExtra: Record<string, unknown> = {}) =>
      generatedAdapter.staticHandler(
        {
          headers: new Headers(),
          payload: { logger: { error: vi.fn() } },
          ...reqExtra,
        } as never,
        {
          doc: { id: 'doc1', prefix: 'legacy' },
          params: { collection: 'media', filename: 'original.png' },
        },
      ),
  }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

describe('getFile stream cancellation', () => {
  it('destroys the GCS read stream when the response body is cancelled', async () => {
    const nodeStream = new Readable({ read() {} })
    const { staticHandler } = createStaticHandler(nodeStream)

    const response = await staticHandler()
    expect(response.status).toBe(200)

    await response.body!.getReader().cancel()
    await tick()

    expect(nodeStream.destroyed).toBe(true)
  })

  it('does not enqueue into the closed controller when the GCS stream emits after cancel', async () => {
    const nodeStream = new Readable({ read() {} })
    const { staticHandler } = createStaticHandler(nodeStream)

    const response = await staticHandler()
    await response.body!.getReader().cancel()
    await tick()

    // Without the fix this throws "Controller is already closed" (ERR_INVALID_STATE)
    expect(() => nodeStream.push(Buffer.from('late-chunk'))).not.toThrow()
    await tick()
  })

  it('destroys the GCS read stream when the request signal aborts', async () => {
    const nodeStream = new Readable({ read() {} })
    const { staticHandler } = createStaticHandler(nodeStream)
    const abortController = new AbortController()

    const response = await staticHandler({ signal: abortController.signal })
    expect(response.status).toBe(200)

    abortController.abort()
    await tick()

    expect(nodeStream.destroyed).toBe(true)
  })

  it('streams the file normally when nothing is cancelled', async () => {
    const nodeStream = Readable.from([Buffer.from('hello')])
    const { createReadStream, staticHandler } = createStaticHandler(nodeStream)

    const response = await staticHandler()

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('hello')
    expect(createReadStream).toHaveBeenCalled()
  })
})
