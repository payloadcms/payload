import { useCallback, useRef } from 'react'

import type { Queue, QueueOptions } from '../utilities/createQueue.js'

import { createQueue } from '../utilities/createQueue.js'

export { createQueue } from '../utilities/createQueue.js'
export type {
  Queue,
  QueueContext,
  QueueOptions,
  QueueResult,
  QueueTask,
} from '../utilities/createQueue.js'

type QueuedFunction = () => Promise<void>

export type QueuedTaskOptions = {
  /** Runs after the queued task settles. */
  afterProcess?: () => void
  /** Return `false` to skip the queued task. */
  beforeProcess?: () => boolean | void
}

export type QueueTaskFunction = (fn: QueuedFunction, options?: QueuedTaskOptions) => void

export type UseQueueResult<TVersion = undefined> = {
  queueTask: QueueTaskFunction
} & Queue<TVersion>

/**
 * Queues asynchronous work sequentially while retaining only the highest-priority pending task.
 * `queueTask` preserves the original fire-and-forget API; `schedule` returns the task result.
 */
export function useQueue(): UseQueueResult
export function useQueue<TVersion>(options: QueueOptions<TVersion>): UseQueueResult<TVersion>
export function useQueue<TVersion>(
  options?: QueueOptions<TVersion>,
): UseQueueResult<TVersion | undefined> {
  const getVersionRef = useRef(options?.getVersion)
  getVersionRef.current = options?.getVersion

  const queueRef = useRef<Queue<TVersion | undefined>>(undefined)
  queueRef.current ??= createQueue({
    getVersion: () => getVersionRef.current?.(),
  })

  const queueTask = useCallback<QueueTaskFunction>((fn, taskOptions) => {
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
