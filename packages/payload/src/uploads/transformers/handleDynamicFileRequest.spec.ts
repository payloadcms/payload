import { setImmediate } from 'node:timers/promises'
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

vi.mock('./getSourceFileResponse.js', () => ({
  getSourceFileResponse: vi.fn(),
}))

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { handleDynamicFileRequest } from './handleDynamicFileRequest.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'
import { resolveUploadDocument } from './resolveUploadDocument.js'

const uploadDocument = { id: '1', filename: 'logo.png', mimeType: 'image/png' }

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

const planPipeline = (
  pipeline: UploadTransformer[],
  claims = new Map<UploadTransformer, string[]>(),
) => vi.mocked(planTransformerPipeline).mockResolvedValue({ claims, options: new Map(), pipeline })

const makeTrackedResponse = () => {
  const onCancel = vi.fn()
  const response = new Response(
    new ReadableStream({
      cancel: onCancel,
      pull: (controller) => controller.enqueue(new TextEncoder().encode('source-bytes')),
    }),
  )

  return { onCancel, response }
}

describe('handleDynamicFileRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveUploadDocument).mockResolvedValue(uploadDocument)
    vi.mocked(checkFileAccess).mockResolvedValue(uploadDocument)
  })

  describe('saved transforms on a document with no stored default', () => {
    const dynamicDocument = {
      ...uploadDocument,
      _stored: false,
      _transforms: { crop: { height: 1, width: 1, x: 0, y: 0 } },
      original: { filename: 'logo-original.png', mimeType: 'image/png' },
    }

    const stage = (handleRequest: UploadTransformer['handleRequest']): UploadTransformer => ({
      slug: 'stage',
      handleRequest: vi.fn(handleRequest),
      mimeTypes: ['image/*'],
    })

    beforeEach(() => {
      vi.mocked(resolveUploadDocument).mockResolvedValue(dynamicDocument)
      vi.mocked(checkFileAccess).mockResolvedValue(dynamicDocument)
    })

    it('should reject an unclaimed saved key, naming it, before reading a file', async () => {
      const transformer = stage(async () => ({ status: 'continue' }))
      planPipeline([transformer])

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('_transforms.crop')

      expect(transformer.handleRequest).not.toHaveBeenCalled()
      expect(getSourceFileResponse).not.toHaveBeenCalled()
    })

    it('should give each stage its own single-use getOriginalFile, and close an original the stage does not return', async () => {
      const originals = [makeTrackedResponse(), makeTrackedResponse()]
      vi.mocked(getSourceFileResponse)
        .mockResolvedValueOnce(originals[0]!.response)
        .mockResolvedValueOnce(originals[1]!.response)
      // Planned in both phases, so it runs twice.
      const transformer = stage(async ({ getOriginalFile }) => {
        await getOriginalFile()
        await expect(getOriginalFile()).rejects.toThrow(TransformerContractError)

        return { response: new Response('output'), status: 'continue' }
      })
      planPipeline([transformer], new Map([[transformer, ['crop']]]))

      await handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() })

      expect(vi.mocked(getSourceFileResponse).mock.calls.map(([args]) => args.filename)).toEqual([
        'logo-original.png',
        'logo-original.png',
      ])
      await vi.waitFor(() =>
        originals.forEach(({ onCancel }) => expect(onCancel).toHaveBeenCalled()),
      )
    })
  })

  describe('failed pipeline cleanup', () => {
    it('should close a source body the throwing transformer locked with its own reader', async () => {
      const source = makeTrackedResponse()
      vi.mocked(getSourceFileResponse).mockResolvedValue(source.response)

      const transformer: UploadTransformer = {
        slug: 'throwing-transformer',
        handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
          const sourceResponse: Response = await getSourceFile()
          await sourceResponse.body!.getReader().read()
          // Drain queued stream work so the abandoned reader leaves a write blocked by backpressure.
          await setImmediate()
          throw new Error('transform failed')
        }),
        mimeTypes: ['image/*'],
      }
      planPipeline([transformer])

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('transform failed')

      await vi.waitFor(() => expect(source.onCancel).toHaveBeenCalled())
    })

    it('should cancel an earlier stage response no later stage read', async () => {
      const stageOutput = makeTrackedResponse()

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
      planPipeline(transformers)

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('transform failed')

      expect(stageOutput.onCancel).toHaveBeenCalled()
    })
  })

  describe('successful pipeline cleanup', () => {
    it('should cancel a fetched source body when the transformer returns a separate response', async () => {
      const source = makeTrackedResponse()
      vi.mocked(getSourceFileResponse).mockResolvedValue(source.response)

      const transformer: UploadTransformer = {
        slug: 'replacement',
        handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
          await getSourceFile()

          return { response: new Response('replacement'), status: 'complete' }
        }),
        mimeTypes: ['image/*'],
      }
      planPipeline([transformer])

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      expect(await result.text()).toBe('replacement')
      await vi.waitFor(() => expect(source.onCancel).toHaveBeenCalled())
    })

    it('should abort a locked source body when the transformer returns a separate response', async () => {
      const source = makeTrackedResponse()
      vi.mocked(getSourceFileResponse).mockResolvedValue(source.response)

      const transformer: UploadTransformer = {
        slug: 'locked-replacement',
        handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
          const sourceResponse: Response = await getSourceFile()
          await sourceResponse.body!.getReader().read()
          await setImmediate()

          return { response: new Response('replacement'), status: 'complete' }
        }),
        mimeTypes: ['image/*'],
      }
      planPipeline([transformer])

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      expect(await result.text()).toBe('replacement')
      await vi.waitFor(() => expect(source.onCancel).toHaveBeenCalled())
    })

    it('should cancel an earlier response when a later transformer replaces it without reading it', async () => {
      const earlierResponse = makeTrackedResponse()
      const transformers: UploadTransformer[] = [
        {
          slug: 'first',
          handleRequest: vi.fn().mockResolvedValue({
            response: earlierResponse.response,
            status: 'continue',
          }),
          mimeTypes: ['image/*'],
        },
        {
          slug: 'second',
          handleRequest: vi.fn().mockResolvedValue({
            response: new Response('replacement'),
            status: 'complete',
          }),
          mimeTypes: ['image/*'],
        },
      ]
      planPipeline(transformers)

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      expect(await result.text()).toBe('replacement')
      expect(earlierResponse.onCancel).toHaveBeenCalled()
    })

    it('should abort a locked earlier source when a later transformer replaces it without reading it', async () => {
      const source = makeTrackedResponse()
      vi.mocked(getSourceFileResponse).mockResolvedValue(source.response)

      const transformers: UploadTransformer[] = [
        {
          slug: 'first',
          handleRequest: vi.fn().mockImplementation(async ({ getSourceFile }) => {
            const sourceResponse: Response = await getSourceFile()
            await sourceResponse.body!.getReader().read()
            await setImmediate()

            return { response: sourceResponse, status: 'continue' }
          }),
          mimeTypes: ['image/*'],
        },
        {
          slug: 'second',
          handleRequest: vi.fn().mockResolvedValue({
            response: new Response('replacement'),
            status: 'complete',
          }),
          mimeTypes: ['image/*'],
        },
      ]
      planPipeline(transformers)

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      expect(await result.text()).toBe('replacement')
      await vi.waitFor(() => expect(source.onCancel).toHaveBeenCalled())
    })
  })
})
