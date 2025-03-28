import { useCallback, useRef } from 'react'

type QueuedTask = {
  discard?: TaskOptions['discard']
  fn: () => Promise<void> | void
  priority?: TaskOptions['priority']
}

type TaskOptions = {
  /**
   * A function that is called after the queue has processed a function
   * Used to perform side effects after processing the queue
   * @returns {void}
   */
  afterProcess?: () => void
  /**
   * A function that can be used to prevent the queue from processing under certain conditions
   * Can also be used to perform side effects before processing the queue
   * @returns {boolean} If `false`, the queue will not process
   */
  beforeProcess?: () => boolean
  /**
   * All tasks that except the last task in the queue will be discarded to prevent a backlog.
   * To ensure a task is not discarded, set the `discard` option to `false`
   * @default undefined
   */
  discard?: boolean
  /**
   * Priority tasks will be processed before non-priority tasks
   * This is helpful to ensure a task added later in the queue is processed first
   * @default false
   */
  priority?: boolean
}

type QueueTask = (fn: QueuedTask['fn'], options?: TaskOptions) => void

/**
 * A React hook that allows you to queue up functions to be executed in order.
 * This is useful when you need to ensure long running networks requests are processed sequentially.
 * Builds up a "queue" of functions to be executed in order, only ever processing the last function in the queue.
 * This ensures that a long queue of tasks doesn't cause a backlog of tasks to be processed.
 * E.g. if you queue a task and it begins running, then you queue 9 more tasks:
 *   1. The currently task will finish
 *   2. The next task in the queue will run
 *   3. All remaining tasks will be discarded
 * @returns {queueTask} A function used to queue a function.
 * @example
 * const { queueTask } = useQueues()
 * queueTask(async () => {
 *   await fetch('https://api.example.com')
 * })
 */
export function useQueues(): {
  queueTask: QueueTask
} {
  const queue = useRef<QueuedTask[]>([])

  const isProcessing = useRef(false)

  const queueTask = useCallback<QueueTask>((fn, options) => {
    queue.current.push({
      discard: options?.discard,
      fn,
      priority: options?.priority,
    })

    async function processQueue() {
      if (isProcessing.current) {
        return
      }

      // Allow the consumer to prevent the queue from processing under certain conditions
      if (typeof options?.beforeProcess === 'function') {
        const shouldContinue = options.beforeProcess()

        if (shouldContinue === false) {
          return
        }
      }

      while (queue.current.length > 0) {
        // Only process the latest, prioritized task in the queue
        const latestTask = queue.current.find((task) => task.priority) || queue.current.pop()

        // This task is about to run, so remove the discard option if it exists
        if ('discard' in latestTask) {
          latestTask.discard = undefined
        }

        // Discard all other tasks that are not explicitly set to not be discarded
        queue.current = queue.current.filter((task) => task.discard === false)

        isProcessing.current = true

        try {
          await latestTask.fn()
        } catch (err) {
          console.error('Error in queued function:', err) // eslint-disable-line no-console
        } finally {
          isProcessing.current = false

          if (typeof options?.afterProcess === 'function') {
            options.afterProcess()
          }
        }
      }
    }

    void processQueue()
  }, [])

  return { queueTask }
}
