import type { PayloadRequest } from '../../types/index.js'

import { expect, test, vi } from 'vitest'

import { mergeBranch } from '../merge.js'
import { mergeBranchHandler } from './merge.js'

vi.mock('../merge.js', () => ({ mergeBranch: vi.fn() }))
vi.mock('../resolveBranch.js', () => ({
  isolateBranchState: ({ req }: { req: PayloadRequest }) => req,
}))

test('should finish a streamed merge after consumer cancellation without mutating caller transaction', async () => {
  let resume!: () => void
  const paused = new Promise<void>((resolve) => {
    resume = resolve
  })
  let complete!: () => void
  const completed = new Promise<void>((resolve) => {
    complete = resolve
  })
  const result = {
    blocked: [],
    canMerge: true,
    mergeable: [],
    merged: [],
    validationErrors: [],
    warnings: [],
  }
  const logger = { error: vi.fn() }
  const req = {
    data: { stream: true },
    headers: new Headers(),
    routeParams: { id: 'branch-id' },
    payload: { config: { cors: [] }, findByID: vi.fn(async () => ({ slug: 'campaign' })), logger },
    transactionID: 'caller',
    user: { id: 'user' },
  } as unknown as PayloadRequest

  vi.mocked(mergeBranch).mockImplementation(async (_payload, options) => {
    expect(options.req?.transactionID).toBeUndefined()
    await paused
    await options.onProgress?.({ index: 1 } as never, options.req!)
    complete()
    return result
  })

  const response = await mergeBranchHandler(req)

  await response.body!.cancel()
  resume()
  await completed
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(req.transactionID).toBe('caller')
  expect(logger.error).not.toHaveBeenCalled()
})
