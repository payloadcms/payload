import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { createFileSource } from './createFileSource.js'
import { createUploadFileSource } from './createUploadFileSource.js'

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

describe('createUploadFileSource', () => {
  it('should read from a temporary file even when a partial probe is present', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'payload-source-'))
    const tempFilePath = path.join(directory, 'source')

    try {
      await writeFile(tempFilePath, 'abcdef')
      const source = createUploadFileSource({
        collectionSlug: 'media',
        file: {
          name: 'a.txt',
          mimetype: 'text/plain',
          data: Buffer.from('a'),
          size: 6,
          tempFilePath,
        },
        req: {} as PayloadRequest,
      })

      expect(new TextDecoder().decode(await source.read({ offset: 2, length: 2 }))).toBe('cd')
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it('should defer provider retrieval until the transformer reads its source', async () => {
    let reads = 0
    const req = {
      payload: {
        collections: {
          media: {
            config: {
              upload: {
                handlers: [
                  async () => {
                    reads++
                    return new Response('abcdef')
                  },
                ],
              },
            },
          },
        },
      },
    } as unknown as PayloadRequest
    const source = createUploadFileSource({
      collectionSlug: 'media',
      file: {
        name: 'a.txt',
        mimetype: 'text/plain',
        data: Buffer.alloc(0),
        size: 6,
        uploadReference: { prefix: 'files' },
      },
      req,
    })

    expect(reads).toBe(0)
    expect(new TextDecoder().decode(await source.read({ length: 2 }))).toBe('ab')
    expect(reads).toBe(1)
  })
})
