import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./resolveUploadDocument.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./resolveUploadDocument.js')>()),
  resolveUploadDocument: vi.fn(),
}))

vi.mock('./planTransformerPipeline.js', () => ({
  planTransformerPipeline: vi.fn(),
}))

vi.mock('../checkFileAccess.js', () => ({
  checkFileAccess: vi.fn(),
}))

vi.mock('../endpoints/getFile.js', () => ({
  retrieveFileResponse: vi.fn(),
}))

vi.mock('./getSourceFileResponse.js', () => ({
  getSourceFileResponse: vi.fn(),
}))

vi.mock('./finalizeFileResponse.js', () => ({
  finalizeFileResponse: vi.fn(({ response }) => response),
}))

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { checkFileAccess } from '../checkFileAccess.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { handleDynamicFileRequest } from './handleDynamicFileRequest.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'
import { resolveUploadDocument } from './resolveUploadDocument.js'

// Filenames are only unique per storage prefix, so the unfiltered lookup can match a
// document the user can't read. That needs a prefix-aware storage adapter, which the
// local-disk integration suite can't reproduce.
const otherTenantDocument = { id: '2', filename: 'logo.png', mimeType: 'image/png', prefix: 'bob' }
const authorizedDocument = { id: '1', filename: 'logo.png', mimeType: 'image/png', prefix: 'alice' }

const collection = {
  config: { slug: 'media', access: { read: vi.fn() }, upload: {} },
} as unknown as Collection

const makeReq = (): PayloadRequest =>
  ({
    payload: {
      config: { upload: { transformers: [] } },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

describe('handleDynamicFileRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveUploadDocument).mockResolvedValue(otherTenantDocument)
    vi.mocked(checkFileAccess).mockResolvedValue(authorizedDocument)
    vi.mocked(getSourceFileResponse).mockResolvedValue(new Response('source-bytes'))
    vi.mocked(retrieveFileResponse).mockResolvedValue(new Response('original-bytes'))
  })

  it('should serve the access-checked document when the unfiltered lookup matched another document with the same filename', async () => {
    vi.mocked(planTransformerPipeline).mockResolvedValue([])

    await handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() })

    expect(retrieveFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ doc: authorizedDocument }),
    )
  })

  it('should transform the access-checked document when the unfiltered lookup matched another document with the same filename', async () => {
    const transformer: UploadTransformer = {
      slug: 'test-transformer',
      handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => ({
        response: await getSourceFile(),
        status: 'complete',
      })),
      mimeTypes: ['image/*'],
    }
    vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

    await handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() })

    expect(getSourceFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ document: authorizedDocument }),
    )
    expect(transformer.handleRequest).toHaveBeenCalledWith(
      expect.objectContaining({ documentID: authorizedDocument.id }),
    )
  })
})
