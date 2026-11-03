import { useRef } from 'react'

export type TaskContext = {
  /**
   * Returns `true` if the queue has not been reset since this task started.
   * Recheck after awaiting work before applying results.
   * Scheduling another task alone does not invalidate this context.
   */
  isCurrent: () => boolean
}

/** Runs when this task reaches the active position in the queue. */
export type Task<T> = (context: TaskContext) => Promise<T>

export type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

export type UseQueueResult = {
  /** Invalidates active task contexts and supersedes pending work. */
  resetQueue: () => void
  /** Adds work to the queue and reports whether it completed or was superseded. */
  scheduleTask: <T>(options: {
    /** Determines which pending task is retained. Lower values take precedence; defaults to `Infinity` (lowest priority). */
    priority?: number
    task: Task<T>
  }) => Promise<QueueResult<T>>
}

type QueueEntry = {
  priority: number
  reject: (reason: unknown) => void
  resolve: (result: QueueResult<unknown>) => void
  task: Task<unknown>
}

const createQueue = (): UseQueueResult => {
  let resetCount = 0
  let isTaskRunning = false
  let pendingTask: QueueEntry | undefined

  const startTask = ({ entry }: { entry: QueueEntry }): void => {
    isTaskRunning = true

    const resetCountAtStart = resetCount

    const context: TaskContext = {
      isCurrent: () => resetCount === resetCountAtStart,
    }

    const taskPromise = (async () => entry.task(context))()

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

  const scheduleTask = <T>(options: {
    priority?: number
    task: Task<T>
  }): Promise<QueueResult<T>> => {
    let resolve!: (result: QueueResult<T>) => void
    let reject!: (reason: unknown) => void

    const result = new Promise<QueueResult<T>>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    })

    const entry: QueueEntry = {
      priority: options.priority ?? Infinity,
      reject,
      resolve: resolve as (result: QueueResult<unknown>) => void,
      task: options.task as Task<unknown>,
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

/**
 * Runs asynchronous tasks one at a time, retaining at most one pending task to avoid building a backlog.
 * Pending work keeps the highest priority (lowest number), with newer tasks winning ties.
 * Scheduling new work never interrupts the active task.
 *
 * Use `scheduleTask` to await a completed result or a superseded status.
 * Task errors reject the returned promise.
 * `resetQueue` discards pending work and invalidates the active task's context without aborting its work.
 * Tasks can check `isCurrent()` before applying results that arrive after a reset.
 *
 * @example
 * const { scheduleTask } = useQueue()
 *
 * const loadPosts = async () => {
 *   const result = await scheduleTask({
 *     priority: 0,
 *     task: async () => {
 *       const response = await fetch('/api/posts')
 *       return response.json()
 *     },
 *   })
 *
 *   if (result.status === 'completed') {
 *     return result.value
 *   }
 * }
 */
export function useQueue(): UseQueueResult {
  const queueRef = useRef<UseQueueResult>(undefined)
  queueRef.current ??= createQueue()

  return queueRef.current
}
