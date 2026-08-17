import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import * as queueExports from './useQueue.js'

type QueueContext<TVersion> = {
  dispatchedVersion: TVersion | undefined
  isCurrent: () => boolean
  isGenerationCurrent: () => boolean
}

type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

type CreateQueue = <TVersion = undefined>(options?: {
  getVersion?: () => TVersion
}) => {
  reset: () => void
  schedule: <T>(task: {
    priority?: number
    run: (context: QueueContext<TVersion>) => Promise<T>
  }) => Promise<QueueResult<T>>
}

const deferred = <T = void>() => Promise.withResolvers<T>()

const getCreateQueue = (): CreateQueue | undefined =>
  Reflect.get(queueExports, 'createQueue') as CreateQueue | undefined

describe('createQueue', () => {
  it('runs one active task and only the latest equal-priority pending task', async () => {
    const createQueue = getCreateQueue()

    expect(createQueue).toBeTypeOf('function')
    if (!createQueue) {
      return
    }

    const active = deferred()
    const calls: string[] = []
    const queue = createQueue()
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

  it('keeps higher-priority pending work', async () => {
    const createQueue = getCreateQueue()

    expect(createQueue).toBeTypeOf('function')
    if (!createQueue) {
      return
    }

    const active = deferred()
    const calls: string[] = []
    const queue = createQueue()

    void queue.schedule({
      run: async () => {
        calls.push('active')
        await active.promise
      },
    })
    const highPriority = queue.schedule({
      priority: 2,
      run: async () => calls.push('high'),
    })
    const lowPriority = queue.schedule({
      priority: 1,
      run: async () => calls.push('low'),
    })

    await expect(lowPriority).resolves.toEqual({ status: 'superseded' })
    active.resolve()
    await highPriority
    expect(calls).toEqual(['active', 'high'])
  })

  it('captures the external version when each task starts', async () => {
    const createQueue = getCreateQueue()

    expect(createQueue).toBeTypeOf('function')
    if (!createQueue) {
      return
    }

    let version = 1
    const active = deferred()
    const versions: number[] = []
    const queue = createQueue({ getVersion: () => version })
    const first = queue.schedule({
      run: async ({ dispatchedVersion, isCurrent }) => {
        versions.push(dispatchedVersion as number)
        await active.promise
        expect(isCurrent()).toBe(false)
      },
    })
    const pending = queue.schedule({
      run: async ({ dispatchedVersion, isCurrent }) => {
        versions.push(dispatchedVersion as number)
        expect(isCurrent()).toBe(true)
      },
    })

    version = 2
    active.resolve()
    await first
    await pending
    expect(versions).toEqual([1, 2])
  })

  it('supersedes pending work on reset and invalidates the active context', async () => {
    const createQueue = getCreateQueue()

    expect(createQueue).toBeTypeOf('function')
    if (!createQueue) {
      return
    }

    const active = deferred()
    let context: QueueContext<undefined> | undefined
    const queue = createQueue()
    const running = queue.schedule({
      run: async (taskContext) => {
        context = taskContext
        await active.promise
      },
    })
    const pending = queue.schedule({ run: async () => undefined })

    queue.reset()

    await expect(pending).resolves.toEqual({ status: 'superseded' })
    expect(context?.isCurrent()).toBe(false)
    expect(context?.isGenerationCurrent()).toBe(false)
    active.resolve()
    await running
  })
})

describe('useQueue', () => {
  it('uses one queue for legacy and scheduled tasks', async () => {
    const active = deferred()
    const calls: string[] = []
    let queue: ReturnType<typeof queueExports.useQueue> | undefined

    const Probe = () => {
      queue = queueExports.useQueue()
      return null
    }

    renderToStaticMarkup(createElement(Probe))
    expect(queue).toBeDefined()

    queue?.queueTask(async () => {
      calls.push('legacy')
      await active.promise
    })
    const scheduled = queue?.schedule({
      run: async () => calls.push('scheduled'),
    })

    expect(calls).toEqual(['legacy'])
    active.resolve()
    await scheduled
    expect(calls).toEqual(['legacy', 'scheduled'])
  })
})
