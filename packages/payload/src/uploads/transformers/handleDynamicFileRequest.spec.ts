import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./resolveUploadDocument.js', () => ({
  resolveUploadDocument: vi.fn(),
}))

vi.mock('./planTransformerPipeline.js', () => ({
  planTransformerPipeline: vi.fn(),
}))

vi.mock('./withFileTransformAccessContext.js', () => ({
  withFileTransformAccessContext: vi.fn(({ callback }) => callback()),
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
import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { finalizeFileResponse } from './finalizeFileResponse.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { handleDynamicFileRequest } from './handleDynamicFileRequest.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'
import { resolveUploadDocument } from './resolveUploadDocument.js'
import { withFileTransformAccessContext } from './withFileTransformAccessContext.js'

const document = { id: '1', filename: 'logo.png', mimeType: 'image/png' }

const makeCollection = (): Collection =>
  ({
    config: { slug: 'media', access: { read: vi.fn() }, upload: {} },
  }) as unknown as Collection

const makeReq = (): PayloadRequest =>
  ({
    payload: {
      config: { upload: { transformers: [] } },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

const makeTransformer = (overrides: Partial<UploadTransformer> = {}): UploadTransformer => ({
  handleRequest: vi.fn().mockResolvedValue({ status: 'continue' }),
  mimeTypes: ['image/*'],
  slug: 'test-transformer',
  ...overrides,
})

describe('handleDynamicFileRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveUploadDocument).mockResolvedValue(document)
    vi.mocked(withFileTransformAccessContext).mockImplementation(({ callback }) => callback())
    vi.mocked(getSourceFileResponse).mockResolvedValue(new Response('source-bytes'))
    vi.mocked(finalizeFileResponse).mockImplementation(async ({ response }) => response)
    vi.mocked(checkFileAccess).mockResolvedValue(document)
    vi.mocked(retrieveFileResponse).mockResolvedValue(new Response('original-bytes'))
  })

  it('should throw NotFound without planning or fetching a source when the document is not found and access is allowed', async () => {
    vi.mocked(resolveUploadDocument).mockResolvedValue(undefined)

    await expect(
      handleDynamicFileRequest({
        collection: makeCollection(),
        filename: 'missing.png',
        req: makeReq(),
      }),
    ).rejects.toMatchObject({ status: 404 })

    expect(checkFileAccess).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'missing.png' }),
    )
    expect(planTransformerPipeline).not.toHaveBeenCalled()
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should defer to checkFileAccess before declaring NotFound, so a denied read on a non-existent filename throws Forbidden instead of leaking non-existence', async () => {
    vi.mocked(resolveUploadDocument).mockResolvedValue(undefined)

    const { Forbidden } = await import('../../errors/Forbidden.js')
    vi.mocked(checkFileAccess).mockRejectedValue(new Forbidden())

    await expect(
      handleDynamicFileRequest({
        collection: makeCollection(),
        filename: 'missing.png',
        req: makeReq(),
      }),
    ).rejects.toMatchObject({ status: 403 })

    expect(planTransformerPipeline).not.toHaveBeenCalled()
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should deny access before planning handleRequest, fetching the source, or calling finalizeFileResponse', async () => {
    vi.mocked(planTransformerPipeline).mockResolvedValue([])

    const { Forbidden } = await import('../../errors/Forbidden.js')
    vi.mocked(checkFileAccess).mockRejectedValue(new Forbidden())

    await expect(
      handleDynamicFileRequest({
        collection: makeCollection(),
        filename: 'logo.png',
        req: makeReq(),
      }),
    ).rejects.toThrow()

    expect(getSourceFileResponse).not.toHaveBeenCalled()
    expect(finalizeFileResponse).not.toHaveBeenCalled()
  })

  it('should call withFileTransformAccessContext with isTransform=true only when the pipeline is non-empty', async () => {
    const transformer = makeTransformer()
    vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

    await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(withFileTransformAccessContext).toHaveBeenCalledWith(
      expect.objectContaining({ isTransform: true }),
    )
  })

  it('should call withFileTransformAccessContext with isTransform=false when no transformer is eligible', async () => {
    vi.mocked(planTransformerPipeline).mockResolvedValue([])

    await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(withFileTransformAccessContext).toHaveBeenCalledWith(
      expect.objectContaining({ isTransform: false }),
    )
  })

  it('should serve the original file through the normal serve path when no transformer joins the pipeline', async () => {
    vi.mocked(planTransformerPipeline).mockResolvedValue([])
    const originalResponse = new Response('original-bytes')
    vi.mocked(retrieveFileResponse).mockResolvedValue(originalResponse)

    const result = await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(result).toBe(originalResponse)
    expect(retrieveFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ doc: document, filename: 'logo.png' }),
    )
    // The normal serve path already applies its own headers (Range, ETag,
    // modifyResponseHeaders) — finalizeFileResponse's non-overridable CORS
    // pass only applies to responses a transformer actually produced.
    expect(finalizeFileResponse).not.toHaveBeenCalled()
    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should serve the original file through the normal serve path when every eligible transformer returns continue without ever consuming the source', async () => {
    const transformer = makeTransformer({
      handleRequest: vi.fn().mockResolvedValue({ status: 'continue' }),
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])
    const originalResponse = new Response('original-bytes')
    vi.mocked(retrieveFileResponse).mockResolvedValue(originalResponse)

    const result = await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(result).toBe(originalResponse)
    expect(finalizeFileResponse).not.toHaveBeenCalled()
  })

  it('should run eligible transformers in declaration order, passing each a fresh getSourceFile', async () => {
    const order: string[] = []
    const first = makeTransformer({
      handleRequest: vi.fn().mockImplementation(async () => {
        order.push('first')
        return { status: 'continue' }
      }),
      slug: 'first',
    })
    const second = makeTransformer({
      handleRequest: vi.fn().mockImplementation(async () => {
        order.push('second')
        return { status: 'continue' }
      }),
      slug: 'second',
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([first, second])

    await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(order).toEqual(['first', 'second'])
  })

  it('should replace the accumulator when a stage returns continue with a response, and pass it to the next stage', async () => {
    const replacement = new Response('resized-bytes')
    const first = makeTransformer({
      handleRequest: vi.fn().mockResolvedValue({ response: replacement, status: 'continue' }),
      slug: 'first',
    })
    const second = makeTransformer({
      handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
        const received = await getSourceFile()
        expect(received).toBe(replacement)
        return { response: received, status: 'continue' }
      }),
      slug: 'second',
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([first, second])

    await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(getSourceFileResponse).not.toHaveBeenCalled()
  })

  it('should stop the pipeline and finalize immediately when a stage returns complete', async () => {
    const completeResponse = new Response('done')
    const first = makeTransformer({
      handleRequest: vi.fn().mockResolvedValue({ response: completeResponse, status: 'complete' }),
      slug: 'first',
    })
    const second = makeTransformer({
      handleRequest: vi.fn(),
      slug: 'second',
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([first, second])

    const result = await handleDynamicFileRequest({
      collection: makeCollection(),
      filename: 'logo.png',
      req: makeReq(),
    })

    expect(result).toBe(completeResponse)
    expect(second.handleRequest).not.toHaveBeenCalled()
  })

  it('should throw a TransformerContractError when a stage consumes its source but returns continue without a response', async () => {
    const transformer = makeTransformer({
      handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
        await getSourceFile()
        return { status: 'continue' }
      }),
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

    await expect(
      handleDynamicFileRequest({
        collection: makeCollection(),
        filename: 'logo.png',
        req: makeReq(),
      }),
    ).rejects.toThrow(TransformerContractError)
  })

  it('should log and propagate a thrown error, aborting later stages', async () => {
    const first = makeTransformer({
      handleRequest: vi.fn().mockRejectedValue(new Error('sharp exploded')),
      slug: 'first',
    })
    const second = makeTransformer({ handleRequest: vi.fn(), slug: 'second' })
    vi.mocked(planTransformerPipeline).mockResolvedValue([first, second])
    const req = makeReq()

    await expect(
      handleDynamicFileRequest({ collection: makeCollection(), filename: 'logo.png', req }),
    ).rejects.toThrow('sharp exploded')

    expect(second.handleRequest).not.toHaveBeenCalled()
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.objectContaining({ message: 'sharp exploded' }) }),
    )
  })

  it('should preserve the status of an intentional APIError thrown by a transformer', async () => {
    const { APIError } = await import('../../errors/APIError.js')
    const transformer = makeTransformer({
      handleRequest: vi.fn().mockRejectedValue(new APIError('bad request', 400)),
    })
    vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

    await expect(
      handleDynamicFileRequest({
        collection: makeCollection(),
        filename: 'logo.png',
        req: makeReq(),
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('should never call any document-persistence method', async () => {
    vi.mocked(planTransformerPipeline).mockResolvedValue([])
    const req = makeReq()
    const update = vi.fn()
    const create = vi.fn()
    Object.assign(req.payload, { create, update })

    await handleDynamicFileRequest({ collection: makeCollection(), filename: 'logo.png', req })

    expect(update).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })
})
