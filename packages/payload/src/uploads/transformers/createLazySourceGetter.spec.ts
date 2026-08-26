import { describe, expect, it, vi } from 'vitest'

import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { createLazySourceGetter } from './createLazySourceGetter.js'

describe('createLazySourceGetter', () => {
  it('should perform no call when constructed', () => {
    const retrieve = vi.fn().mockResolvedValue(new Response('body'))

    createLazySourceGetter({ retrieve })

    expect(retrieve).not.toHaveBeenCalled()
  })

  it('should flip wasCalled() to true as soon as get() begins, before it resolves', () => {
    let resolveRetrieve: (response: Response) => void = () => {}
    const retrieve = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRetrieve = resolve
        }),
    )
    const source = createLazySourceGetter({ retrieve })

    expect(source.wasCalled()).toBe(false)

    const pending = source.get()

    expect(source.wasCalled()).toBe(true)

    resolveRetrieve(new Response('body'))
    return pending
  })

  it('should return the retrieval response from the first get() call', async () => {
    const response = new Response('body')
    const retrieve = vi.fn().mockResolvedValue(response)
    const source = createLazySourceGetter({ retrieve })

    await expect(source.get()).resolves.toBe(response)
  })

  it('should reject a second call with TransformerContractError while the first is still pending', async () => {
    let resolveRetrieve: (response: Response) => void = () => {}
    const retrieve = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRetrieve = resolve
        }),
    )
    const source = createLazySourceGetter({ retrieve })

    const first = source.get()

    await expect(source.get()).rejects.toThrow(TransformerContractError)

    resolveRetrieve(new Response('body'))
    await first
  })

  it('should reject a second call with TransformerContractError after the first rejected, without retrying', async () => {
    const retrieve = vi.fn().mockRejectedValue(new Error('retrieval failed'))
    const source = createLazySourceGetter({ retrieve })

    await expect(source.get()).rejects.toThrow('retrieval failed')
    await expect(source.get()).rejects.toThrow(TransformerContractError)

    expect(retrieve).toHaveBeenCalledTimes(1)
  })

  it('should not retry a failed first retrieval on subsequent get() calls', async () => {
    const retrieve = vi.fn().mockRejectedValue(new Error('retrieval failed'))
    const source = createLazySourceGetter({ retrieve })

    await expect(source.get()).rejects.toThrow('retrieval failed')
    await expect(source.get()).rejects.toThrow(TransformerContractError)
    await expect(source.get()).rejects.toThrow(TransformerContractError)

    expect(retrieve).toHaveBeenCalledTimes(1)
  })
})
