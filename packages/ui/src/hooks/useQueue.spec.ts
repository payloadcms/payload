import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { UseQueueResult } from './useQueue.js'

import { useQueue } from './useQueue.js'

const deferred = <T = void>() => Promise.withResolvers<T>()

const renderQueue = (): UseQueueResult => {
  let queue: UseQueueResult | undefined

  const Probe = () => {
    queue = useQueue()
    return null
  }

  renderToStaticMarkup(createElement(Probe))

  if (!queue) {
    throw new Error('Queue did not render')
  }

  return queue
}

describe('useQueue', () => {
  it('should run one active task and only the latest equal-priority pending task', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()
    const first = queue.schedule({
      run: async () => {
        calls.push('first')
        await active.promise
        return 'first result'
      },
    })
    const dropped = queue.schedule({
      run: async () => {
        calls.push('dropped')
      },
    })
    const latest = queue.schedule({
      run: async () => {
        calls.push('latest')
        return 'latest result'
      },
    })

    expect(calls).toEqual(['first'])
    await expect(dropped).resolves.toEqual({ status: 'superseded' })
    active.resolve()
    await expect(first).resolves.toEqual({ status: 'completed', value: 'first result' })
    await expect(latest).resolves.toEqual({ status: 'completed', value: 'latest result' })
    expect(calls).toEqual(['first', 'latest'])
  })

  it('should retain the pending task with the lowest priority number', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    void queue.schedule({
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const low = queue.schedule({
      priority: 2,
      run: async () => calls.push('low'),
    })
    const medium = queue.schedule({
      priority: 1,
      run: async () => calls.push('medium'),
    })
    const high = queue.schedule({
      priority: 0,
      run: async () => calls.push('high'),
    })

    active.resolve()
    await expect(low).resolves.toEqual({ status: 'superseded' })
    await expect(medium).resolves.toEqual({ status: 'superseded' })
    await high
    expect(calls).toEqual(['active', 'high'])
  })

  it('should not replace higher-priority pending work with a lower-priority task', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    void queue.schedule({
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const high = queue.schedule({
      priority: 0,
      run: async () => calls.push('high'),
    })
    const low = queue.schedule({
      priority: 1,
      run: async () => calls.push('low'),
    })

    active.resolve()
    await expect(low).resolves.toEqual({ status: 'superseded' })
    await high
    expect(calls).toEqual(['active', 'high'])
  })

  it('should give pending tasks without a priority the lowest precedence', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    void queue.schedule({ run: async () => active.promise })
    const high = queue.schedule({
      priority: 0,
      run: async () => calls.push('high'),
    })
    const low = queue.schedule({ run: async () => calls.push('low') })

    active.resolve()
    await expect(low).resolves.toEqual({ status: 'superseded' })
    await high
    expect(calls).toEqual(['high'])
  })

  it('should start pending work after an active task rejects', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()
    const rejected = queue.schedule({
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const pending = queue.schedule({
      run: async () => calls.push('pending'),
    })

    active.reject(new Error('active task failed'))
    await expect(rejected).rejects.toThrow('active task failed')
    await pending
    expect(calls).toEqual(['active', 'pending'])
  })

  it('should supersede pending work on reset and invalidate the active context', async () => {
    const active = deferred()
    let isCurrent: (() => boolean) | undefined
    let isQueueReset: (() => boolean) | undefined
    const queue = renderQueue()
    const running = queue.schedule({
      run: async (context) => {
        isCurrent = context.isCurrent
        isQueueReset = context.isQueueReset
        await active.promise
      },
    })
    const pending = queue.schedule({ run: async () => undefined })

    queue.reset()

    await expect(pending).resolves.toEqual({ status: 'superseded' })
    expect(isCurrent?.()).toBe(false)
    expect(isQueueReset?.()).toBe(true)
    active.resolve()
    await running
  })

  it('should wait for an unabortable active promise before starting pending work', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    void queue.schedule({
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const pending = queue.schedule({
      run: async () => calls.push('pending'),
    })

    await Promise.resolve()
    expect(calls).toEqual(['active'])
    active.resolve()
    await pending
    expect(calls).toEqual(['active', 'pending'])
  })

  it('should use one queue for legacy and scheduled tasks', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    queue.queueTask(async () => {
      calls.push('legacy')
      await active.promise
    })
    const scheduled = queue.schedule({
      run: async () => calls.push('scheduled'),
    })

    expect(calls).toEqual(['legacy'])
    active.resolve()
    await scheduled
    expect(calls).toEqual(['legacy', 'scheduled'])
  })
})
