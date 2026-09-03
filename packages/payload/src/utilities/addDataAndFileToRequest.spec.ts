import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

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

describe('addDataAndFileToRequest', () => {
  it('should parse multipart form-data even when content-length is absent', async () => {
    const req = createReqWithMultipartBody()

    expect(req.headers.get('content-length')).toBeNull()

    await addDataAndFileToRequest(req as PayloadRequest)

    expect(req.file).toBeDefined()
    expect(req.file?.name).toBe('hello.txt')
    expect(req.file?.mimetype).toBe('text/plain')
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
        uploadReference: {
          key: 'example.txt',
        },
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
        db: {
          findOne: vi.fn(async () => null),
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
        uploadReference: {
          key: 'example.txt',
        },
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
        uploadReference: {
          key: 'example.txt',
        },
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
