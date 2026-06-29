import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { addDataAndFileToRequest } from './addDataAndFileToRequest.js'

type MinimalReq = Pick<PayloadRequest, 'body' | 'headers' | 'method' | 'payload'> & {
  file?: PayloadRequest['file']
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

  it('should avoid buffering oversized remote upload handler responses', async () => {
    const collectionSlug = 'media'
    const oversizedBytes = 0x80000000
    const fileMeta = JSON.stringify({
      clientUploadContext: { source: 'test' },
      collectionSlug,
      filename: 'remote-file.txt',
      mimeType: 'text/plain',
      size: oversizedBytes,
    })

    const formData = new FormData()
    formData.append('file', fileMeta)

    const request = new Request('http://localhost/api/upload', {
      body: formData,
      method: 'POST',
    })

    const req = {
      body: request.body,
      headers: request.headers,
      method: request.method,
      payload: {
        collections: {
          [collectionSlug]: {
            config: {
              upload: {
                handlers: [
                  async () =>
                    new Response(Buffer.from('hello from remote handler'), {
                      headers: {
                        'Content-Type': 'text/plain',
                      },
                    }),
                ],
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
      },
    } as unknown as PayloadRequest

    await addDataAndFileToRequest(req)

    expect(req.file).toBeDefined()
    expect(req.file?.size).toBe(oversizedBytes)
    expect(req.file?.data.length).toBe(0)
    expect(req.file?.mimetype).toBe('text/plain')
  })
})
