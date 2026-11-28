import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { UseQueueOptions, UseQueueResult } from './useQueue.js'

import { useQueue } from './useQueue.js'

const deferred = <T = void>() => Promise.withResolvers<T>()

const renderQueue = (options: UseQueueOptions = {}): UseQueueResult => {
  let queue: UseQueueResult | undefined

  const Probe = () => {
    queue = useQueue(options)
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
    const first = queue.queueTask({
      task: async () => {
        calls.push('first')
        await active.promise
        return 'first result'
      },
    })
    const dropped = queue.queueTask({
      task: async () => {
        calls.push('dropped')
      },
    })
    const latest = queue.queueTask({
      task: async () => {
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

  it('should capture the external version when each task starts', async () => {
    let version = 1
    const active = deferred()
    const currentStates: boolean[] = []
    const queue = renderQueue({ getSequence: () => version })
    const first = queue.queueTask({
      task: async ({ isCurrent }) => {
        currentStates.push(isCurrent())
        await active.promise
        currentStates.push(isCurrent())
      },
    })
    const pending = queue.queueTask({
      task: async ({ isCurrent }) => {
        currentStates.push(isCurrent())
      },
    })

    version = 2
    active.resolve()
    await first
    await pending
    expect(currentStates).toEqual([true, false, true])
  })

  it('should retain the pending task with the lowest priority number', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()

    void queue.queueTask({
      task: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const low = queue.queueTask({
      priority: 2,
      task: async () => calls.push('low'),
    })
    const medium = queue.queueTask({
      priority: 1,
      task: async () => calls.push('medium'),
    })
    const high = queue.queueTask({
      priority: 0,
      task: async () => calls.push('high'),
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

    void queue.queueTask({
      task: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const high = queue.queueTask({
      priority: 0,
      task: async () => calls.push('high'),
    })
    const low = queue.queueTask({
      priority: 1,
      task: async () => calls.push('low'),
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

    void queue.queueTask({ task: async () => active.promise })
    const high = queue.queueTask({
      priority: 0,
      task: async () => calls.push('high'),
    })
    const low = queue.queueTask({ task: async () => calls.push('low') })

    active.resolve()
    await expect(low).resolves.toEqual({ status: 'superseded' })
    await high
    expect(calls).toEqual(['high'])
  })

  it('should start pending work after an active task rejects', async () => {
    const active = deferred()
    const calls: string[] = []
    const queue = renderQueue()
    const rejected = queue.queueTask({
      task: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const pending = queue.queueTask({
      task: async () => calls.push('pending'),
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
    const running = queue.queueTask({
      task: async (context) => {
        isCurrent = context.isCurrent
        isQueueReset = context.isQueueReset
        await active.promise
      },
    })
    const pending = queue.queueTask({ task: async () => undefined })

    queue.resetQueue()

    await expect(pending).resolves.toEqual({ status: 'superseded' })
    expect(isCurrent?.()).toBe(false)
    expect(isQueueReset?.()).toBe(true)
    active.resolve()
    await running
  })
})
