import { useCallback, useRef } from 'react'

export type QueueContext = {
  /** Whether both the queue generation and external version are still current. */
  isCurrent: () => boolean
  /** Whether the queue has not been reset since this task began running. */
  isGenerationCurrent: () => boolean
}

export type QueueTask<T> = {
  /** Determines which task is retained while another task is active. Higher values take precedence. */
  priority?: number
  /** Runs when this task reaches the active position in the queue. */
  run: (context: QueueContext) => Promise<T>
}

export type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

type Queue = {
  /** Invalidates active task contexts and supersedes pending work. */
  reset: () => void
  /** Adds work to the queue and reports whether it completed or was superseded. */
  schedule: <T>(task: QueueTask<T>) => Promise<QueueResult<T>>
}

export type UseQueueOptions = {
  /** Returns the external version used to determine whether an active task is still current. */
  getVersion?: () => unknown
}

type PendingEntry = {
  priority: number
  reject: (reason: unknown) => void
  resolve: (result: QueueResult<unknown>) => void
  run: (context: QueueContext) => Promise<unknown>
}

const initializeQueue = ({ getVersion }: { getVersion: () => unknown }): Queue => {
  let generation = 0
  let isActive = false
  let pending: PendingEntry | undefined

  const start = ({ entry }: { entry: PendingEntry }): void => {
    isActive = true

    const activeGeneration = generation
    const dispatchedVersion = getVersion()
    const isGenerationCurrent = () => generation === activeGeneration
    const context: QueueContext = {
      isCurrent: () => isGenerationCurrent() && Object.is(getVersion(), dispatchedVersion),
      isGenerationCurrent,
    }

    const taskPromise = (async () => entry.run(context))()

    void taskPromise
      .then(
        (value) => entry.resolve({ status: 'completed', value }),
        (error) => entry.reject(error),
      )
      .finally(() => {
        isActive = false

        const next = pending
        pending = undefined

        if (next) {
          start({ entry: next })
        }
      })
  }

  const reset = (): void => {
    generation += 1

    if (pending) {
      pending.resolve({ status: 'superseded' })
      pending = undefined
    }
  }

  const schedule = <T>(task: QueueTask<T>): Promise<QueueResult<T>> => {
    let resolve!: (result: QueueResult<T>) => void
    let reject!: (reason: unknown) => void
    const result = new Promise<QueueResult<T>>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })
    const entry: PendingEntry = {
      priority: task.priority ?? 0,
      reject,
      resolve: resolve as (result: QueueResult<unknown>) => void,
      run: task.run as (context: QueueContext) => Promise<unknown>,
    }

    if (!isActive) {
      start({ entry })
      return result
    }

    if (!pending || entry.priority >= pending.priority) {
      pending?.resolve({ status: 'superseded' })
      pending = entry
    } else {
      resolve({ status: 'superseded' })
    }

    return result
  }

  return { reset, schedule }
}

type QueuedFunction = () => Promise<void>

export type QueuedTaskOptions = {
  /** Runs after the queued task settles. */
  afterProcess?: () => void
  /** Return `false` to skip the queued task. */
  beforeProcess?: () => boolean | void
}

export type UseQueueResult = {
  queueTask: (fn: QueuedFunction, options?: QueuedTaskOptions) => void
} & Queue

/**
 * Queues asynchronous work sequentially while retaining only the highest-priority pending task.
 * `queueTask` preserves the original fire-and-forget API; `schedule` returns the task result.
 */
export function useQueue(options: UseQueueOptions = {}): UseQueueResult {
  const getVersionRef = useRef(options.getVersion)
  getVersionRef.current = options.getVersion

  const queueRef = useRef<Queue>(undefined)
  queueRef.current ??= initializeQueue({ getVersion: () => getVersionRef.current?.() })

  const queueTask = useCallback<UseQueueResult['queueTask']>((fn, taskOptions) => {
    void queueRef.current.schedule({
      run: async () => {
        if (taskOptions?.beforeProcess?.() === false) {
          return
        }

        try {
          await fn()
        } catch (error) {
          console.error('Error in queued function:', error) // eslint-disable-line no-console
        } finally {
          taskOptions?.afterProcess?.()
        }
      },
    })
  }, [])

  return {
    queueTask,
    reset: queueRef.current.reset,
    schedule: queueRef.current.schedule,
  }
}
