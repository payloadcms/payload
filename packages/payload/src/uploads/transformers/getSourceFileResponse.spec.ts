import { describe, expect, it, vi } from 'vitest'

vi.mock('../endpoints/getFile.js', () => ({
  retrieveFileResponse: vi.fn(),
}))

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { retrieveFileResponse } from '../endpoints/getFile.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { type ResolvedUploadDocument } from './resolveUploadDocument.js'

describe('getSourceFileResponse', () => {
  it("should delegate to retrieveFileResponse with operation fixed to 'transform'", async () => {
    const response = new Response('source-bytes')
    vi.mocked(retrieveFileResponse).mockResolvedValue(response)

    const collection = {} as Collection
    const document: ResolvedUploadDocument = {
      id: '1',
      filename: 'logo.png',
      mimeType: 'image/png',
    }
    const req = {} as PayloadRequest

    const result = await getSourceFileResponse({
      collection,
      document,
      filename: 'logo.png',
      prefix: 'tenants/acme',
      req,
    })

    expect(result).toBe(response)
    expect(retrieveFileResponse).toHaveBeenCalledWith({
      collection,
      doc: document,
      filename: 'logo.png',
      prefix: 'tenants/acme',
      operation: 'transform',
      req,
    })
  })
})
