import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { addDataAndFileToRequest } from './addDataAndFileToRequest.js'

type MinimalReq = Pick<PayloadRequest, 'body' | 'headers' | 'method' | 'payload'> & {
  file?: PayloadRequest['file']
  query?: PayloadRequest['query']
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
  collectionUpload = {},
  fileField,
  hasSharp = true,
  staticHandler,
}: {
  collectionUpload?: Record<string, unknown>
  fileField: Record<string, unknown>
  hasSharp?: boolean
  staticHandler?: () => Promise<Response> | Response
}): MinimalReq => {
  const formData = new FormData()
  formData.append('_payload', JSON.stringify({}))
  formData.append('file', JSON.stringify(fileField))

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
              handlers: staticHandler ? [staticHandler] : [],
              ...collectionUpload,
            },
          },
        },
      },
      config: {
        bodyParser: {},
        sharp: hasSharp ? {} : undefined,
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
    it('should skip the staticHandler fetch-back when client dimensions are present and no resizing is needed', async () => {
      let handlerCalled = false
      const req = createClientUploadReq({
        fileField: {
          collectionSlug: 'media',
          filename: 'photo.png',
          height: 480,
          mimeType: 'image/png',
          size: 1234,
          width: 640,
        },
        staticHandler: () => {
          handlerCalled = true
          return Response.redirect('https://example.com/photo.png', 302)
        },
      })

      await addDataAndFileToRequest(req as PayloadRequest)

      expect(handlerCalled).toBe(false)
      expect(req.file?.data.length).toBe(0)
      expect(req.file?.width).toBe(640)
      expect(req.file?.height).toBe(480)
      expect(req.file?.mimetype).toBe('image/png')
    })

    it('should fetch back via staticHandler when imageSizes are configured, carrying client dimensions through', async () => {
      let handlerCalled = false
      const req = createClientUploadReq({
        collectionUpload: { imageSizes: [{ name: 'thumb', width: 100 }] },
        fileField: {
          collectionSlug: 'media',
          filename: 'photo.png',
          height: 480,
          mimeType: 'image/png',
          size: 1234,
          width: 640,
        },
        staticHandler: () => {
          handlerCalled = true
          return new Response(Buffer.from('real-bytes'), {
            headers: { 'Content-Type': 'image/png' },
          })
        },
      })

      await addDataAndFileToRequest(req as PayloadRequest)

      expect(handlerCalled).toBe(true)
      expect(req.file?.data.length).toBeGreaterThan(0)
      expect(req.file?.width).toBe(640)
      expect(req.file?.height).toBe(480)
    })

    it('should fetch back via staticHandler when client dimensions are absent', async () => {
      let handlerCalled = false
      const req = createClientUploadReq({
        fileField: {
          collectionSlug: 'media',
          filename: 'photo.png',
          mimeType: 'image/png',
          size: 1234,
        },
        staticHandler: () => {
          handlerCalled = true
          return new Response(Buffer.from('real-bytes'), {
            headers: { 'Content-Type': 'image/png' },
          })
        },
      })

      await addDataAndFileToRequest(req as PayloadRequest)

      expect(handlerCalled).toBe(true)
      expect(req.file?.data.length).toBeGreaterThan(0)
    })
  })
})
