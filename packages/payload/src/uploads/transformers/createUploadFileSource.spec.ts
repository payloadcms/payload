import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { createUploadFileSource } from './createUploadFileSource.js'

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
