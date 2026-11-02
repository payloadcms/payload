import { useCallback, useRef } from 'react'

export type QueueContext = {
  /**
   * Returns `true` if the queue has not been reset since this task started.
   * Recheck after awaiting work before applying results.
   * Scheduling another task alone does not invalidate this context.
   */
  isCurrent: () => boolean
  /**
   * Returns `true` if the queue has been reset since this task started.
   */
  isQueueReset: () => boolean
}

export type QueueTask<T> = {
  /** Determines which pending task is retained. Lower values take precedence; defaults to `Infinity` (lowest priority). */
  priority?: number
  /** Runs when this task reaches the active position in the queue. */
  run: (context: QueueContext) => Promise<T>
}

export type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

type Queue = {
  /** Invalidates active task contexts and supersedes pending work. */
  resetQueue: () => void
  /** Adds work to the queue and reports whether it completed or was superseded. */
  scheduleTask: <T>(task: QueueTask<T>) => Promise<QueueResult<T>>
}

type QueueEntry = {
  priority: number
  reject: (reason: unknown) => void
  resolve: (result: QueueResult<unknown>) => void
  run: (context: QueueContext) => Promise<unknown>
}

const createQueue = (): Queue => {
  let resetCount = 0
  let isTaskRunning = false
  let pendingTask: QueueEntry | undefined

  const startTask = ({ entry }: { entry: QueueEntry }): void => {
    isTaskRunning = true

    const resetCountAtStart = resetCount

    const isQueueReset = () => resetCount !== resetCountAtStart

    const context: QueueContext = {
      isCurrent: () => !isQueueReset(),
      isQueueReset,
    }

    const taskPromise = (async () => entry.run(context))()

    void taskPromise
      .then(
        (value) => entry.resolve({ status: 'completed', value }),
        (error) => entry.reject(error),
      )
      .finally(() => {
        isTaskRunning = false

        const next = pendingTask
        pendingTask = undefined

        if (next) {
          startTask({ entry: next })
        }
      })
  }

  const resetQueue = (): void => {
    resetCount += 1

    if (pendingTask) {
      pendingTask.resolve({ status: 'superseded' })
      pendingTask = undefined
    }
  }

  const scheduleTask = <T>(task: QueueTask<T>): Promise<QueueResult<T>> => {
    let resolve!: (result: QueueResult<T>) => void
    let reject!: (reason: unknown) => void

    const result = new Promise<QueueResult<T>>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })

    const entry: QueueEntry = {
      priority: task.priority ?? Infinity,
      reject,
      resolve: resolve as (result: QueueResult<unknown>) => void,
      run: task.run as (context: QueueContext) => Promise<unknown>,
    }

    if (!isTaskRunning) {
      startTask({ entry })
      return result
    }

    if (!pendingTask || entry.priority <= pendingTask.priority) {
      pendingTask?.resolve({ status: 'superseded' })
      pendingTask = entry
    } else {
      resolve({ status: 'superseded' })
    }

    return result
  }

  return { resetQueue, scheduleTask }
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
 * `queueTask` preserves the original fire-and-forget API; `scheduleTask` returns the task result.
 */
export function useQueue(): UseQueueResult {
  const queueRef = useRef<Queue>(undefined)
  queueRef.current ??= createQueue()

  const queueTask = useCallback<UseQueueResult['queueTask']>((fn, taskOptions) => {
    void queueRef.current.scheduleTask({
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
    resetQueue: queueRef.current.resetQueue,
    scheduleTask: queueRef.current.scheduleTask,
  }
}
