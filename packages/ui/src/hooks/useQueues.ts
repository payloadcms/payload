import { useCallback, useRef } from 'react'

export function useQueues(): {
  queueTask: (fn: (signal: AbortSignal) => Promise<void>) => void
} {
  const runningTaskRef = useRef<null | Promise<void>>(null)
  const queuedTask = useRef<((signal: AbortSignal) => Promise<void>) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const queueTask = useCallback((fn: (signal: AbortSignal) => Promise<void>) => {
    // Overwrite the queued task every time a new one arrives
    queuedTask.current = fn

    // If a task is already running, abort it and return
    if (runningTaskRef.current !== null) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      return
    }

    const executeTask = async () => {
      while (queuedTask.current) {
        const taskToRun = queuedTask.current
        queuedTask.current = null // Reset latest task before running

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
          runningTaskRef.current = taskToRun(controller.signal)
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
  }, [])

  return { queueTask }
}
