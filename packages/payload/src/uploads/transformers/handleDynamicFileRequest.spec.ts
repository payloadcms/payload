import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./resolveUploadDocument.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./resolveUploadDocument.js')>()),
  resolveUploadDocument: vi.fn(),
}))

vi.mock('./planTransformerPipeline.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./planTransformerPipeline.js')>()),
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

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
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

const makeReq = (transformers: UploadTransformer[] = []): PayloadRequest =>
  ({
    payload: {
      config: { upload: { transformers } },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

const actualPlanTransformerPipeline = (
  await vi.importActual<typeof import('./planTransformerPipeline.js')>(
    './planTransformerPipeline.js',
  )
).planTransformerPipeline

const events: string[] = []

const mockReadAccess = ({ plain, transform }: { plain: boolean; transform: boolean }) => {
  vi.mocked(checkFileAccess).mockImplementation(async ({ req }) => {
    const isTransform = req.fileTransform === true

    events.push(isTransform ? 'access:transform' : 'access:plain')

    if (!(isTransform ? transform : plain)) {
      throw new Forbidden()
    }

    return undefined
  })
}

const makeTransformer = ({ canTransform }: { canTransform: boolean }): UploadTransformer => ({
  slug: 'test-transformer',
  canTransform: vi.fn(({ req }) => {
    events.push(req.fileTransform ? 'canTransform:flagged' : 'canTransform')
    return canTransform
  }),
  handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => ({
    response: await getSourceFile(),
    status: 'complete',
  })),
  mimeTypes: ['image/*'],
})

describe('handleDynamicFileRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    events.length = 0
    vi.mocked(planTransformerPipeline).mockImplementation(actualPlanTransformerPipeline)
    vi.mocked(resolveUploadDocument).mockResolvedValue(otherTenantDocument)
    vi.mocked(checkFileAccess).mockResolvedValue(authorizedDocument)
    vi.mocked(getSourceFileResponse).mockResolvedValue(new Response('source-bytes'))
    vi.mocked(retrieveFileResponse).mockResolvedValue(new Response('original-bytes'))
  })

  it('should apply saved state from the original before request overrides without mutating the document', async () => {
    const document = {
      ...authorizedDocument,
      _transforms: { custom: 'saved' },
      original: { filename: 'original.png', mimeType: 'image/png' },
    }
    const order: string[] = []
    const transformer: UploadTransformer = {
      slug: 'state',
      mimeTypes: ['image/*'],
      canTransform: (args) =>
        args.operation === 'request' && args.purpose === 'persisted-default'
          ? { canTransform: true, handledTransformKeys: ['custom'], options: 'saved-options' }
          : { canTransform: true, options: 'override-options' },
      handleRequest: async ({ doc, getSourceFile, options, purpose }) => {
        const source = await getSourceFile()
        order.push(`${purpose}:${options}:${await source.text()}`)
        doc.title = 'request-only'

        return {
          response: new Response(purpose === 'persisted-default' ? 'default' : 'override', {
            headers: { 'Content-Type': 'image/png' },
          }),
          status: 'continue',
        }
      },
    }
    vi.mocked(resolveUploadDocument).mockResolvedValue(document)
    vi.mocked(checkFileAccess).mockResolvedValue(document)
    vi.mocked(getSourceFileResponse).mockResolvedValue(
      new Response('original', { headers: { 'Content-Type': 'image/png' } }),
    )

    const response = await handleDynamicFileRequest({
      collection,
      filename: document.filename,
      req: makeReq([transformer]),
    })

    expect(await response.text()).toBe('override')
    expect(order).toEqual([
      'persisted-default:saved-options:original',
      'request-override:override-options:default',
    ])
    expect(document).not.toHaveProperty('title')
    expect(getSourceFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'original.png' }),
    )
  })

  it('should reject unclaimed saved keys before fetching the source', async () => {
    const document = { ...authorizedDocument, _transforms: { custom: 'saved' } }
    const transformer: UploadTransformer = {
      slug: 'declining',
      mimeTypes: ['image/*'],
      canTransform: () => false,
      handleRequest: vi.fn(),
    }
    vi.mocked(resolveUploadDocument).mockResolvedValue(document)
    vi.mocked(checkFileAccess).mockResolvedValue(document)

    await expect(
      handleDynamicFileRequest({
        collection,
        filename: document.filename,
        req: makeReq([transformer]),
      }),
    ).rejects.toThrow('custom')
    expect(getSourceFileResponse).not.toHaveBeenCalled()
    expect(transformer.handleRequest).not.toHaveBeenCalled()
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
    vi.mocked(planTransformerPipeline).mockResolvedValue([{ transformer }])

    await handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() })

    expect(getSourceFileResponse).toHaveBeenCalledWith(
      expect.objectContaining({ document: authorizedDocument }),
    )
    expect(transformer.handleRequest).toHaveBeenCalledWith(
      expect.objectContaining({ doc: expect.objectContaining({ id: authorizedDocument.id }) }),
    )
  })

  describe('failed pipeline cleanup', () => {
    const makeTrackedSourceResponse = () => {
      const onCancel = vi.fn()
      const response = new Response(
        new ReadableStream({
          cancel: onCancel,
          pull: (controller) => controller.enqueue(new TextEncoder().encode('source-bytes')),
        }),
      )

      return { onCancel, response }
    }

    it('should close a source body the throwing transformer locked with its own reader', async () => {
      const source = makeTrackedSourceResponse()
      vi.mocked(getSourceFileResponse).mockResolvedValue(source.response)

      const transformer: UploadTransformer = {
        slug: 'throwing-transformer',
        handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
          const sourceResponse: Response = await getSourceFile()
          await sourceResponse.body!.getReader().read()
          throw new Error('transform failed')
        }),
        mimeTypes: ['image/*'],
      }
      vi.mocked(planTransformerPipeline).mockResolvedValue([{ transformer }])

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('transform failed')

      await vi.waitFor(() => expect(source.onCancel).toHaveBeenCalled())
    })

    it('should cancel an earlier stage response no later stage read', async () => {
      const stageOutput = makeTrackedSourceResponse()

      const transformers: UploadTransformer[] = [
        {
          slug: 'first',
          handleRequest: vi.fn().mockResolvedValue({
            response: stageOutput.response,
            status: 'continue',
          }),
          mimeTypes: ['image/*'],
        },
        {
          slug: 'second',
          handleRequest: vi.fn().mockRejectedValue(new Error('transform failed')),
          mimeTypes: ['image/*'],
        },
      ]
      vi.mocked(planTransformerPipeline).mockResolvedValue(
        transformers.map((transformer) => ({ transformer })),
      )

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('transform failed')

      expect(stageOutput.onCancel).toHaveBeenCalled()
    })
  })

  describe('access control ordering', () => {
    beforeEach(() => {
      vi.mocked(resolveUploadDocument).mockResolvedValue(authorizedDocument)
    })

    it('should not run canTransform or handleRequest when read access is denied in both modes', async () => {
      mockReadAccess({ plain: false, transform: false })
      const transformer = makeTransformer({ canTransform: true })

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq([transformer]) }),
      ).rejects.toBeInstanceOf(Forbidden)

      expect(transformer.canTransform).not.toHaveBeenCalled()
      expect(transformer.handleRequest).not.toHaveBeenCalled()
      expect(events).toEqual(['access:transform', 'access:plain'])
    })

    it('should run transform-aware access before canTransform and transform when allowed', async () => {
      mockReadAccess({ plain: false, transform: true })
      const transformer = makeTransformer({ canTransform: true })

      await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq([transformer]),
      })

      expect(events).toEqual(['access:transform', 'canTransform'])
      expect(transformer.handleRequest).toHaveBeenCalled()
    })

    it('should serve the original when transform-aware access is denied, ordinary read is allowed and no transformer applies', async () => {
      mockReadAccess({ plain: true, transform: false })
      const transformer = makeTransformer({ canTransform: false })

      await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq([transformer]),
      })

      expect(events).toEqual(['access:transform', 'access:plain', 'canTransform'])
      expect(retrieveFileResponse).toHaveBeenCalled()
    })

    it('should reject a transform when only ordinary read access is allowed', async () => {
      mockReadAccess({ plain: true, transform: false })
      const transformer = makeTransformer({ canTransform: true })

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq([transformer]) }),
      ).rejects.toBeInstanceOf(Forbidden)

      expect(transformer.handleRequest).not.toHaveBeenCalled()
    })

    it('should not serve the original when only transform-aware access is allowed and no transformer applies', async () => {
      mockReadAccess({ plain: false, transform: true })
      const transformer = makeTransformer({ canTransform: false })

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq([transformer]) }),
      ).rejects.toBeInstanceOf(Forbidden)

      expect(events).toEqual(['access:transform', 'canTransform', 'access:plain'])
      expect(retrieveFileResponse).not.toHaveBeenCalled()
    })

    it('should use only an ordinary read access check when no transformer matches the MIME type', async () => {
      mockReadAccess({ plain: true, transform: false })
      const transformer = { ...makeTransformer({ canTransform: true }), mimeTypes: ['video/*'] }

      await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq([transformer]),
      })

      expect(events).toEqual(['access:plain'])
      expect(transformer.canTransform).not.toHaveBeenCalled()
      expect(retrieveFileResponse).toHaveBeenCalled()
    })

    it('should return not found for a missing file only when both access modes allow it', async () => {
      vi.mocked(resolveUploadDocument).mockResolvedValue(undefined)
      mockReadAccess({ plain: true, transform: true })

      await expect(
        handleDynamicFileRequest({ collection, filename: 'missing.png', req: makeReq() }),
      ).rejects.toBeInstanceOf(NotFound)

      mockReadAccess({ plain: false, transform: true })

      await expect(
        handleDynamicFileRequest({ collection, filename: 'missing.png', req: makeReq() }),
      ).rejects.toBeInstanceOf(Forbidden)
    })
  })
})
