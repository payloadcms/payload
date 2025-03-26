import { useCallback, useRef } from 'react'

type queuedFunction = () => Promise<void>

/**
 * A React hook that allows you to queue up functions to be executed in order.
 * This is useful when you need to ensure log running networks requests are processed sequentially.
 * Builds up a "queue" of functions to be executed, and only ever processes the last function in the queue.
 * The remaining queue is cleared out to ensure it remains shallow.
 */
export function useQueues(): {
  queueTask: (fn: queuedFunction) => void
} {
  const queue = useRef<queuedFunction[]>([])

  const queueTask = useCallback((fn: queuedFunction) => {
    queue.current.push(fn)

    const processQueue = async () => {
      if (queue.current.length === 0) {
        return
      }

      while (queue.current.length > 0) {
        const latestTask = queue.current.pop() // Only process the last task in the queue
        queue.current = [] // Reset the queue to ensure it remains shallow

        if (latestTask) {
          try {
            await latestTask()
          } catch (err) {
            console.error('Error in queued function:', err) // eslint-disable-line no-console
          }
        }
      }
    }

    void processQueue()
  }, [])

  return { queueTask }
}
