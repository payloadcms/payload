import { useCallback, useRef } from 'react'

export type TaskContext = {
  /**
   * Returns `true` if the queue has not been reset and the external sequence still matches the one captured when this task started.
   * Recheck after awaiting work before applying results.
   * Scheduling another task alone does not invalidate this context.
   */
  isCurrent: () => boolean
  /**
   * Returns `true` if the queue has been reset since this task started, regardless of external sequence changes.
   */
  isQueueReset: () => boolean
}

/** Runs when this task reaches the active position in the queue. */
export type Task<T> = (context: TaskContext) => Promise<T>

export type QueueResult<T> = { status: 'completed'; value: T } | { status: 'superseded' }

export type UseQueueOptions = {
  /** Returns the external sequence used to determine whether an active task is still current. */
  getSequence?: () => unknown
}

export type UseQueueResult = {
  /** Adds work to the queue and reports whether it completed or was superseded. */
  queueTask: <T>(options: {
    /** Determines which pending task is retained. Lower values take precedence; defaults to `Infinity` (lowest priority). */
    priority?: number
    task: Task<T>
  }) => Promise<QueueResult<T>>
  /**
   * Invalidates active task contexts and supersedes pending work.
   * The active task is not aborted, so newly queued work still waits for it to settle.
   */
  resetQueue: () => void
}

type QueueEntry = {
  priority: number
  reject: (reason: unknown) => void
  resolve: (result: QueueResult<unknown>) => void
  task: Task<unknown>
}

/**
 * Runs asynchronous tasks one at a time, retaining at most one pending task to avoid building a backlog.
 * Pending work keeps the highest priority (lowest number), with newer tasks winning ties.
 * Scheduling new work never interrupts the active task.
 *
 * Use `queueTask` to await a completed result or a superseded status.
 * Task errors reject the returned promise.
 * `resetQueue` discards pending work and invalidates the active task's context without aborting its work, so new tasks still wait for it to settle.
 * Tasks can check `isCurrent()` before applying results that arrive after a reset or an external sequence change.
 *
 * @example
 * const { queueTask } = useQueue()
 *
 * const loadPosts = async () => {
 *   const result = await queueTask({
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
 *
 * @internal - this hook may be removed or receive breaking changes in minor releases.
 */
export function useQueue(options: UseQueueOptions = {}): UseQueueResult {
  const getSequenceRef = useRef(options.getSequence)
  const resetCount = useRef(0)
  const isTaskRunning = useRef(false)
  const pendingTask = useRef<QueueEntry | undefined>(undefined)

  getSequenceRef.current = options.getSequence

  const startTask = useCallback(function runTask(entry: QueueEntry): void {
    isTaskRunning.current = true

    const resetCountAtStart = resetCount.current
    const sequenceAtStart = getSequenceRef.current?.()
    const isQueueReset = () => resetCount.current !== resetCountAtStart

    const context: TaskContext = {
      isCurrent: () => !isQueueReset() && Object.is(getSequenceRef.current?.(), sequenceAtStart),
      isQueueReset,
    }

    const taskPromise = (async () => entry.task(context))()

    void taskPromise
      .then(
        (value) => entry.resolve({ status: 'completed', value }),
        (error) => entry.reject(error),
      )
      .finally(() => {
        isTaskRunning.current = false

        const next = pendingTask.current
        pendingTask.current = undefined

        if (next) {
          runTask(next)
        }
      })
  }, [])

  const resetQueue = useCallback((): void => {
    resetCount.current += 1

    if (pendingTask.current) {
      pendingTask.current.resolve({ status: 'superseded' })
      pendingTask.current = undefined
    }
  }, [])

  const queueTask = useCallback<UseQueueResult['queueTask']>(
    <T>(options: { priority?: number; task: Task<T> }): Promise<QueueResult<T>> => {
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

      if (!isTaskRunning.current) {
        startTask(entry)
        return result
      }

      if (!pendingTask.current || entry.priority <= pendingTask.current.priority) {
        pendingTask.current?.resolve({ status: 'superseded' })
        pendingTask.current = entry
      } else {
        resolve({ status: 'superseded' })
      }

      return result
    },
    [startTask],
  )

  return { queueTask, resetQueue }
}
