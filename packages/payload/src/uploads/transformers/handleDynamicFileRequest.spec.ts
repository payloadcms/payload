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
          // Drain queued stream work so the abandoned reader leaves a write blocked by backpressure.
          await setImmediate()
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
          await setImmediate()

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

  describe('streaming responses', () => {
    const passThrough: UploadTransformer = {
      slug: 'pass-through',
      handleRequest: async ({ getSourceFile }) => ({
        response: await getSourceFile(),
        status: 'continue',
      }),
      mimeTypes: ['image/*'],
    }

    beforeEach(() => {
      vi.mocked(planTransformerPipeline).mockResolvedValue([
        passThrough,
        { ...passThrough, slug: 'second-pass-through' },
      ])
    })

    it('should stream every chunk and preserve response metadata through multiple stages', async () => {
      const chunks = ['first', '-', 'last']
      const onCancel = vi.fn()
      const source = new Response(
        new ReadableStream({
          cancel: onCancel,
          pull(controller) {
            const chunk = chunks.shift()

            if (chunk === undefined) {
              controller.close()
            } else {
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          },
        }),
        { headers: { 'Content-Type': 'image/png' }, status: 201, statusText: 'Created' },
      )

      vi.mocked(getSourceFileResponse).mockResolvedValue(source)

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      expect(await result.text()).toBe('first-last')
      expect(result.status).toBe(201)
      expect(result.statusText).toBe('Created')
      expect(result.headers.get('Content-Type')).toBe('image/png')
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should propagate source read failures through multiple stages', async () => {
      const error = new Error('source read failed')
      const source = new Response(
        new ReadableStream({
          pull(controller) {
            controller.error(error)
          },
        }),
      )

      vi.mocked(getSourceFileResponse).mockResolvedValue(source)

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })

      await expect(result.text()).rejects.toBe(error)
    })

    it('should propagate consumer cancellation through multiple stages', async () => {
      const onCancel = vi.fn()
      const source = new Response(
        new ReadableStream({
          cancel: onCancel,
          pull: (controller) => controller.enqueue(new TextEncoder().encode('source-bytes')),
        }),
      )

      vi.mocked(getSourceFileResponse).mockResolvedValue(source)

      const result = await handleDynamicFileRequest({
        collection,
        filename: 'logo.png',
        req: makeReq(),
      })
      const reader = result.body!.getReader()

      await reader.read()
      await setImmediate()
      await reader.cancel('consumer disconnected')

      await vi.waitFor(() =>
        expect(onCancel).toHaveBeenCalledExactlyOnceWith('consumer disconnected'),
      )
    })
  })
})
