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

describe('handleDynamicFileRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolveUploadDocument).mockResolvedValue(uploadDocument)
    vi.mocked(checkFileAccess).mockResolvedValue(uploadDocument)
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
      vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

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
      vi.mocked(planTransformerPipeline).mockResolvedValue(transformers)

      await expect(
        handleDynamicFileRequest({ collection, filename: 'logo.png', req: makeReq() }),
      ).rejects.toThrow('transform failed')

      expect(stageOutput.onCancel).toHaveBeenCalled()
    })
  })

  describe('successful pipeline cleanup', () => {
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
      vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

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

          return { response: new Response('replacement'), status: 'complete' }
        }),
        mimeTypes: ['image/*'],
      }
      vi.mocked(planTransformerPipeline).mockResolvedValue([transformer])

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
      vi.mocked(planTransformerPipeline).mockResolvedValue(transformers)

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
      vi.mocked(planTransformerPipeline).mockResolvedValue(transformers)

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
