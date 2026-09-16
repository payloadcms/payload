import type { CollectionConfig, FileData, PayloadRequest, RequestContext, TypeWithID } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { GeneratedAdapter } from '../types.js'

import { getAfterChangeHook } from './afterChange.js'

const collection = { slug: 'media' } as CollectionConfig

const doc = {
  id: 1,
  filename: 'test.png',
  mimeType: 'image/png',
} as unknown as FileData & TypeWithID

const createAdapter = () =>
  ({
    name: 'mock',
    handleDelete: vi.fn(),
    handleUpload: vi.fn().mockResolvedValue({ url: 'https://example.com/test.png' }),
    staticHandler: vi.fn(),
  }) as unknown as GeneratedAdapter

/**
 * Builds a req whose `payload.update` mimics the Local API: when a nested
 * operation receives a req that already has a non-empty context,
 * `createLocalReq` re-binds `req.context` to a shallow copy of it
 * (see `getRequestContext` in `packages/payload/src/utilities/createLocalReq.ts`).
 */
const createReq = (
  context: RequestContext,
  options?: { onUpdate?: (req: PayloadRequest) => Promise<void> | void },
): PayloadRequest => {
  const req = {
    context,
    file: {
      name: 'test.png',
      data: Buffer.from('test'),
      mimetype: 'image/png',
      size: 4,
    },
    payload: {
      logger: { error: vi.fn() },
      update: vi.fn().mockImplementation(async () => {
        await options?.onUpdate?.(req as unknown as PayloadRequest)
        req.context = { ...req.context }
        return doc
      }),
    },
  }

  return req as unknown as PayloadRequest
}

describe('getAfterChangeHook', () => {
  it('does not leak skipCloudStorage onto a caller-provided context object', async () => {
    const sharedContext: RequestContext = {}
    const hook = getAfterChangeHook({ adapter: createAdapter(), collection })

    await hook({
      doc,
      operation: 'create',
      previousDoc: undefined,
      req: createReq(sharedContext),
    } as Parameters<typeof hook>[0])

    expect('skipCloudStorage' in sharedContext).toBe(false)
  })

  it('uploads files on subsequent operations that reuse the same context object', async () => {
    const sharedContext: RequestContext = {}
    const adapter = createAdapter()
    const hook = getAfterChangeHook({ adapter, collection })

    // Sequential Local API calls sharing one context object, each with its
    // own req - the seed/import-script pattern from #17546.
    for (let i = 0; i < 3; i++) {
      await hook({
        doc,
        operation: 'create',
        previousDoc: undefined,
        req: createReq(sharedContext),
      } as Parameters<typeof hook>[0])
    }

    expect(adapter.handleUpload).toHaveBeenCalledTimes(3)
  })

  it('keeps the flag set during the nested metadata update to prevent recursion', async () => {
    let flagDuringUpdate: unknown
    const req = createReq(
      {},
      {
        onUpdate: (updateReq) => {
          flagDuringUpdate = updateReq.context.skipCloudStorage
        },
      },
    )
    const hook = getAfterChangeHook({ adapter: createAdapter(), collection })

    await hook({
      doc,
      operation: 'create',
      previousDoc: undefined,
      req,
    } as Parameters<typeof hook>[0])

    expect(flagDuringUpdate).toBe(true)
    // Cleaned up from the re-bound req.context as well, so later writes
    // reusing this req are not skipped.
    expect(req.context.skipCloudStorage).toBeUndefined()
  })

  it('removes the flag from the shared context even when the nested update rejects', async () => {
    const sharedContext: RequestContext = {}
    const req = createReq(sharedContext)
    ;(req.payload.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('update failed'))
    const hook = getAfterChangeHook({ adapter: createAdapter(), collection })

    await expect(
      hook({
        doc,
        operation: 'create',
        previousDoc: undefined,
        req,
      } as Parameters<typeof hook>[0]),
    ).rejects.toThrow('update failed')

    expect('skipCloudStorage' in sharedContext).toBe(false)
  })
})
