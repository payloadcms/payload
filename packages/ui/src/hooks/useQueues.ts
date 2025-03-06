import { useRef } from 'react'

export function useQueues() {
  const runningTaskRef = useRef<null | Promise<void>>(null)
  const latestTaskRef = useRef<(() => Promise<void>) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const queueTask = (fn: () => Promise<void>) => {
    // Overwrite the latest task
    latestTaskRef.current = fn

    // If there's a running task, don't stack more tasks; just update `latestTaskRef`
    if (runningTaskRef.current !== null) {
      return
    }

    const executeTask = async () => {
      while (latestTaskRef.current) {
        const taskToRun = latestTaskRef.current
        latestTaskRef.current = null // Reset latest task before running

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
          runningTaskRef.current = taskToRun()
          await runningTaskRef.current // Wait for the task to complete
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error in queued function:', err) // eslint-disable-line no-console
          }
        } finally {
          runningTaskRef.current = null
        }
      }
    }

    void executeTask()
  }

  return queueTask
}
