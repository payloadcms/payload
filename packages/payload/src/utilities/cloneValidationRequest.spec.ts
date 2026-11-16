import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { cloneValidationRequest } from './cloneValidationRequest.js'

describe('cloneValidationRequest', () => {
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
