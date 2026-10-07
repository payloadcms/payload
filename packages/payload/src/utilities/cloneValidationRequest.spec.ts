import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { cloneValidationRequest } from './cloneValidationRequest.js'

describe('cloneValidationRequest', () => {
  it('should return an empty object for an undefined request', () => {
    expect(cloneValidationRequest({ request: undefined })).toEqual({})
  })

  it('should clone a fetch request while preserving abort propagation', () => {
    const abortController = new AbortController()
    const request = new Request('https://example.com/api/posts', {
      headers: { 'x-test': 'value' },
      method: 'POST',
      signal: abortController.signal,
    }) as unknown as PayloadRequest

    const clonedRequest = cloneValidationRequest({ request })

    expect(clonedRequest.url).toBe('https://example.com/api/posts')
    expect(clonedRequest.method).toBe('POST')
    expect(clonedRequest.headers).not.toBe(request.headers)
    expect((clonedRequest.headers as unknown as Headers).get('x-test')).toBe('value')
    expect(clonedRequest.signal?.aborted).toBe(false)

    abortController.abort()

    expect(clonedRequest.signal?.aborted).toBe(true)
  })

  it('should clone own enumerable properties independently of the source request', () => {
    const request = {
      context: { marker: 'original' },
    } as unknown as PayloadRequest

    const clonedRequest = cloneValidationRequest({ request })

    expect(clonedRequest.context).toEqual({ marker: 'original' })
    expect(clonedRequest.context).not.toBe(request.context)
  })

  it('should default context, query, and routeParams to empty objects', () => {
    const request = {} as unknown as PayloadRequest

    const clonedRequest = cloneValidationRequest({ request })

    expect(clonedRequest.context).toEqual({})
    expect(clonedRequest.query).toEqual({})
    expect(clonedRequest.routeParams).toEqual({})
  })

  it('should share properties reused across validation locale passes', () => {
    const payload = {}
    const request = {
      payload,
      transactionID: 'txn-1',
    } as unknown as PayloadRequest

    const clonedRequest = cloneValidationRequest({ request })

    expect(clonedRequest.payload).toBe(payload)
    expect(clonedRequest.transactionID).toBe('txn-1')
  })

  it('should isolate file metadata without copying file buffers', () => {
    const fileBuffer = Buffer.from('validation upload')
    const req = {
      file: {
        data: fileBuffer,
        mimetype: 'text/plain',
        name: 'original.txt',
        size: fileBuffer.byteLength,
      },
      files: {
        attachment: [
          {
            data: fileBuffer,
            mimetype: 'text/plain',
            name: 'attachment.txt',
            size: fileBuffer.byteLength,
          },
        ],
      },
    } satisfies Partial<PayloadRequest>

    const clonedReq = cloneValidationRequest({ request: req })

    expect(clonedReq.file).not.toBe(req.file)
    expect(clonedReq.file?.data).toBe(fileBuffer)
    expect(clonedReq.files?.attachment).not.toBe(req.files.attachment)
    expect(clonedReq.files?.attachment[0]).not.toBe(req.files.attachment[0])
    expect(clonedReq.files?.attachment[0]?.data).toBe(fileBuffer)

    clonedReq.file!.name = 'changed.txt'
    clonedReq.files!.attachment[0]!.name = 'changed-attachment.txt'

    expect(req.file.name).toBe('original.txt')
    expect(req.files.attachment[0]!.name).toBe('attachment.txt')
  })
})
