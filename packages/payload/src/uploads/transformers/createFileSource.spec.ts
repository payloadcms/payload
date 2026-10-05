import { describe, expect, it } from 'vitest'

import { createFileSource } from './createFileSource.js'

describe('createFileSource', () => {
  it('should read a bounded slice without consuming the full file', async () => {
    const source = createFileSource({
      file: new File(['abcdef'], 'image.png', { type: 'image/png' }),
    })

    expect(new TextDecoder().decode(await source.read({ length: 3, offset: 2 }))).toBe('cde')
    expect(source.mimeType).toBe('image/png')
    expect(source.size).toBe(6)
  })

  it('should not retrieve a durable source until it is consumed', async () => {
    let reads = 0
    const source = createFileSource({
      filename: 'image.png',
      mimeType: 'image/png',
      retrieve: async () => {
        reads++
        return new Response('abcdef')
      },
    })

    expect(reads).toBe(0)
    expect(new TextDecoder().decode(await source.read({ length: 2, offset: 1 }))).toBe('bc')
    expect(reads).toBe(1)
  })

  it('should reject an oversized whole-file read and cancel its stream', async () => {
    let wasCancelled = false
    const source = createFileSource({
      filename: 'video.mp4',
      mimeType: 'video/mp4',
      retrieve: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(10))
            },
            cancel() {
              wasCancelled = true
            },
          }),
        ),
    })

    await expect(source.arrayBuffer({ maxBytes: 4 })).rejects.toThrow('limit')
    expect(wasCancelled).toBe(true)
  })

  it('should reject invalid read bounds before retrieving a source', async () => {
    let reads = 0
    const source = createFileSource({
      filename: 'image.png',
      mimeType: 'image/png',
      retrieve: async () => {
        reads++
        return new Response('abcdef')
      },
    })

    await expect(source.read({ length: -1 })).rejects.toThrow()
    await expect(source.arrayBuffer({ maxBytes: Infinity })).rejects.toThrow()
    expect(reads).toBe(0)
  })
})
