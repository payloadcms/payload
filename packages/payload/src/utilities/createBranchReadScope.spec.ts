import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { createBranchReadRequest } from './createBranchReadRequest.js'
import { createBranchReadScope } from './createBranchReadScope.js'

const setup = ({ shouldSerializeReads = false } = {}) => {
  const readStates = vi.fn(async (_args: { reads: unknown[]; req?: unknown }) => [])
  const findGlobal = vi.fn(async (_args: { slug: string; req?: unknown }) => ({
    title: 'Native global',
  }))
  const nativeAdapter = { branching: { queryProjection: { readStates, findGlobal } } }
  const scope = createBranchReadScope({ adapter: nativeAdapter, shouldSerializeReads })
  const req = createBranchReadRequest({
    assertActive: scope.assertActive,
    payload: { db: scope.adapter } as unknown as Payload,
    req: { context: {} } as PayloadRequest,
    transactionID: 'snapshot',
  })

  scope.setRequest({ req })
  return { readStates, findGlobal, req, scope }
}

describe('batched branch readiness read admission', () => {
  it('should admit only the immutable scoped request and expire captured batch methods', async () => {
    const { readStates, req, scope } = setup()
    const read = scope.adapter.branching.queryProjection.readStates

    await expect(read({ reads: [], req })).resolves.toEqual([])
    expect(readStates).toHaveBeenCalledWith({ reads: [], req })
    await expect(read({ reads: [], req: { ...req } })).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
    expect(readStates).toHaveBeenCalledTimes(1)
    expect(Object.keys(scope.adapter.branching.queryProjection)).toEqual([])
    expect(Object.getPrototypeOf(scope.adapter.branching.queryProjection)).toBeNull()
    expect(() => Reflect.get(scope.adapter.branching.queryProjection, 'driver')).toThrow()
    scope.revoke()
    expect(() => read({ reads: [], req })).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
    expect(readStates).toHaveBeenCalledTimes(1)
  })

  it('should bind native global singleton queries to the registered request and revoke captured methods', async () => {
    const { findGlobal, req, scope } = setup()
    const read = scope.adapter.branching.queryProjection.findGlobal
    await expect(read({ slug: 'settings', req })).resolves.toEqual({ title: 'Native global' })
    await expect(read({ slug: 'settings', req: { ...req } })).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
    expect(findGlobal).toHaveBeenCalledTimes(1)
    scope.revoke()
    expect(() => read({ slug: 'settings', req })).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
    expect(findGlobal).toHaveBeenCalledTimes(1)
  })

  it('should recheck queued batch admission after revocation before any second native read', async () => {
    const { readStates, req, scope } = setup({ shouldSerializeReads: true })
    let release!: () => void
    let entered!: () => void
    const firstEntered = new Promise<void>((resolve) => {
      entered = resolve
    })
    const firstCanFinish = new Promise<void>((resolve) => {
      release = resolve
    })

    readStates.mockImplementationOnce(async () => {
      entered()
      await firstCanFinish
      return []
    })
    const first = scope.adapter.branching.queryProjection.readStates({ reads: [], req })

    await firstEntered
    const second = scope.adapter.branching.queryProjection.readStates({ reads: [], req })
    const rejected = expect(second).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })

    scope.revoke()
    release()
    await first
    await rejected
    expect(readStates).toHaveBeenCalledTimes(1)
  })

  it('should reject unknown helper getters before reading the native object and detect an absent optional helper', () => {
    const { scope } = setup()
    const getter = vi.fn()

    Object.defineProperty(scope.nativeAdapter.branching.queryProjection, 'unknown', { get: getter })
    expect(() => Reflect.get(scope.adapter.branching.queryProjection, 'unknown')).toThrow()
    expect(getter).not.toHaveBeenCalled()
    Object.defineProperty(scope.nativeAdapter, 'readStates', { get: getter })
    expect(() => Reflect.get(scope.adapter, 'readStates')).toThrow()
    expect(getter).not.toHaveBeenCalled()
    delete (scope.nativeAdapter.branching.queryProjection as { readStates?: unknown }).readStates
    expect(scope.adapter.branching.queryProjection.readStates).toBeUndefined()
    scope.revoke()
  })
})
