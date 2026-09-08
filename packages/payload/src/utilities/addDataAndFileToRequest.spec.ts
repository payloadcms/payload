import type { PayloadRequest } from '../types/index.js'
import type { ClientUploadData } from '../uploads/getFileFromClientUpload.js'
import type { SanitizedUploadConfig } from '../uploads/types.js'

import fs from 'fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { addDataAndFileToRequest } from './addDataAndFileToRequest.js'

type MinimalReq = Pick<PayloadRequest, 'body' | 'headers' | 'method' | 'payload'> & {
  file?: PayloadRequest['file']
  routeParams?: PayloadRequest['routeParams']
}

const createReqWithMultipartBody = (): MinimalReq => {
  const formData = new FormData()
  formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'hello.txt')

  const request = new Request('http://localhost/api/upload', {
    body: formData,
    method: 'POST',
  })

  return {
    body: request.body,
    headers: request.headers,
    method: request.method,
    payload: {
      collections: {},
      config: {
        bodyParser: {},
        upload: {},
      },
      logger: {
        error: () => {},
      },
    } as unknown as PayloadRequest['payload'],
  }
}

const createClientUploadReq = ({
  file,
  handler,
  upload,
}: {
  file: ClientUploadData
  handler: NonNullable<SanitizedUploadConfig['handlers']>[number]
  upload?: Partial<SanitizedUploadConfig>
}): MinimalReq => {
  const formData = new FormData()
  formData.append('file', JSON.stringify(file))

  const request = new Request('http://localhost/api/media', {
    body: formData,
    method: 'POST',
  })

  return {
    body: request.body,
    headers: request.headers,
    method: request.method,
    payload: {
      collections: {
        media: {
          config: {
            upload: {
              disableLocalStorage: true,
              handlers: [handler],
              ...upload,
            },
          },
        },
      },
      config: {
        bodyParser: {},
        upload: {},
      },
      logger: {
        error: () => {},
      },
    } as unknown as PayloadRequest['payload'],
  }
}

describe('addDataAndFileToRequest', () => {
  it('should parse multipart form-data even when content-length is absent', async () => {
    const req = createReqWithMultipartBody()

    expect(req.headers.get('content-length')).toBeNull()

    await addDataAndFileToRequest(req as PayloadRequest)

    expect(req.file).toBeDefined()
    expect(req.file?.name).toBe('hello.txt')
    expect(req.file?.mimetype).toBe('text/plain')
  })

  describe('client uploads', () => {
    const tempFilesToRemove: string[] = []

    afterEach(async () => {
      for (const tempFilePath of tempFilesToRemove) {
        await fs.rm(tempFilePath, { force: true })
      }
      tempFilesToRemove.length = 0
    })

    it('materializes client-upload metadata without buffering an unused cloud file', async () => {
      const handler = vi.fn(() => {
        throw new Error('No-content handler was invoked')
      })
      const req = createClientUploadReq({
        file: {
          clientUploadContext: { prefix: '' },
          collectionSlug: 'media',
          filename: 'large.mp4',
          mimeType: 'video/mp4',
          size: 5_000_000_000,
        },
        handler,
        upload: { disableLocalStorage: true },
      })

      await addDataAndFileToRequest(req as PayloadRequest)

      expect(handler).not.toHaveBeenCalled()
      expect(req.file).toMatchObject({
        clientUploadContext: { prefix: '' },
        mimetype: 'video/mp4',
        name: 'large.mp4',
        size: 5_000_000_000,
      })
      expect(req.file?.data.length).toBe(0)
    })

    it('streams a full-content client upload to a temp file without buffering the whole body', async () => {
      const chunks = [Buffer.from('chunk-one-'), Buffer.from('chunk-two')]
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk)
          }
          controller.close()
        },
      })
      const response = new Response(stream, {
        headers: { 'Content-Type': 'video/mp4' },
        status: 200,
      })
      const arrayBufferTripwire = vi.fn(async () => {
        throw new Error('Unexpected whole-body buffering')
      })
      Object.defineProperty(response, 'arrayBuffer', { value: arrayBufferTripwire })

      const handler = vi.fn(async () => response)
      const req = createClientUploadReq({
        file: {
          clientUploadContext: { prefix: '' },
          collectionSlug: 'media',
          filename: 'clip.mp4',
          mimeType: 'video/mp4',
          size: 20,
        },
        handler,
        upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
      })

      await addDataAndFileToRequest(req as PayloadRequest)
      tempFilesToRemove.push(req.file!.tempFilePath!)

      expect(arrayBufferTripwire).not.toHaveBeenCalled()
      expect(req.file?.data.length).toBe(0)
      expect(req.file?.tempFilePath).toBeDefined()
      const written = await fs.readFile(req.file!.tempFilePath!)
      expect(written.toString()).toBe(chunks.map((chunk) => chunk.toString()).join(''))
    })
  })

  it('should handle upload instructions with the route collection', async () => {
    const formData = new FormData()
    formData.append(
      'file',
      JSON.stringify({
        collectionSlug: 'private-media',
        filename: 'example.txt',
        mimeType: 'text/plain',
        size: 11,
      }),
    )

    const request = new Request('http://localhost/api/public-media', {
      body: formData,
      method: 'POST',
    })

    const privateHandler = vi.fn()
    const publicHandler = vi.fn((_req, args) => {
      return new Response('hello world', {
        headers: {
          'content-type': 'text/plain',
          'x-collection': args.params.collection,
        },
      })
    })

    const req: MinimalReq = {
      body: request.body,
      headers: request.headers,
      method: request.method,
      payload: {
        collections: {
          'private-media': {
            config: {
              upload: {
                handlers: [privateHandler],
              },
            },
          },
          'public-media': {
            config: {
              upload: {
                handlers: [publicHandler],
              },
            },
          },
        },
        config: {
          bodyParser: {},
          upload: {},
        },
        logger: {
          error: () => {},
        },
      } as unknown as PayloadRequest['payload'],
      routeParams: {
        collection: 'public-media',
      },
    }

    await addDataAndFileToRequest(req as PayloadRequest)

    expect(privateHandler).not.toHaveBeenCalled()
    expect(publicHandler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        params: expect.objectContaining({
          collection: 'public-media',
          filename: 'example.txt',
        }),
      }),
    )
    expect(req.file?.name).toBe('example.txt')
    expect(req.file?.mimetype).toBe('text/plain')
  })

  it('should require a route collection for upload instructions', async () => {
    const formData = new FormData()
    formData.append(
      'file',
      JSON.stringify({
        collectionSlug: 'media',
        filename: 'example.txt',
        mimeType: 'text/plain',
        size: 11,
      }),
    )

    const request = new Request('http://localhost/api/graphql', {
      body: formData,
      method: 'POST',
    })
    const handler = vi.fn(() => new Response('hello world'))

    const req: MinimalReq = {
      body: request.body,
      headers: request.headers,
      method: request.method,
      payload: {
        collections: {
          media: {
            config: {
              upload: {
                handlers: [handler],
              },
            },
          },
        },
        config: {
          bodyParser: {},
          upload: {},
        },
        logger: {
          error: () => {},
        },
      } as unknown as PayloadRequest['payload'],
    }

    await expect(addDataAndFileToRequest(req as PayloadRequest)).rejects.toThrow(
      'Invalid upload collection.',
    )

    expect(handler).not.toHaveBeenCalled()
  })

  it('should require the route collection to support uploads', async () => {
    const formData = new FormData()
    formData.append(
      'file',
      JSON.stringify({
        collectionSlug: 'media',
        filename: 'example.txt',
        mimeType: 'text/plain',
        size: 11,
      }),
    )

    const request = new Request('http://localhost/api/posts', {
      body: formData,
      method: 'POST',
    })
    const handler = vi.fn(() => new Response('hello world'))

    const req: MinimalReq = {
      body: request.body,
      headers: request.headers,
      method: request.method,
      payload: {
        collections: {
          media: {
            config: {
              upload: {
                handlers: [handler],
              },
            },
          },
          posts: {
            config: {},
          },
        },
        config: {
          bodyParser: {},
          upload: {},
        },
        logger: {
          error: () => {},
        },
      } as unknown as PayloadRequest['payload'],
      routeParams: {
        collection: 'posts',
      },
    }

    await expect(addDataAndFileToRequest(req as PayloadRequest)).rejects.toThrow(
      'Invalid upload collection.',
    )

    expect(handler).not.toHaveBeenCalled()
  })
})
