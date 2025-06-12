'use client'
import { useCallback, useRef } from 'react'

/**
 * Simple hook that lets you run any callback once the main thread is idle
 * (via `requestIdleCallback`) or when that API is missing (Safari) - after the
 * next animation frame (`interactionResponse`).
 *
 * This will help you to avoid blocking the main thread with heavy work.
 *
 * The latest invocation wins: if a new run is queued before the previous one
 * executes, the previous task is cancelled.
 *
 * Usage:
 * ```ts
 * const runDeprioritized = useRunDeprioritized();
 *
 * const onEditorChange = (state: EditorState) => {
 *   runDeprioritized(() => {
 *     // heavy work here …
 *   });
 * };
 * ```
 *
 * @param timeout  Optional timeout (ms) for `requestIdleCallback`; defaults to 500 ms.
 * @returns        A `runDeprioritized(fn)` helper.
 */

export function useRunDeprioritized(timeout = 500) {
  const idleHandleRef = useRef<number>(undefined)

  /**
   * Schedule `fn` and resolve when it has executed.
   */
  const runDeprioritized = useCallback(
    (fn: () => void): Promise<void> => {
      return new Promise<void>((resolve) => {
        const exec = () => {
          fn()
          resolve()
        }

        if ('requestIdleCallback' in window) {
          // Cancel any previously queued task so only the latest runs.
          if ('cancelIdleCallback' in window && idleHandleRef.current !== undefined) {
            // Cancel earlier scheduled value updates,
            // so that a CPU-limited event loop isn't flooded with n callbacks for n keystrokes into the rich text field,
            // but that there's only ever the latest one state update
            // dispatch task, to be executed with the next idle time,
            // or the deadline of 500ms.
            cancelIdleCallback(idleHandleRef.current)
          }
          // Schedule the state update to happen the next time the browser has sufficient resources,
          // or the latest after 500ms.
          idleHandleRef.current = requestIdleCallback(exec, { timeout })
        } else {
          // Safari fallback: rAF + setTimeout shim.
          void interactionResponse().then(exec)
        }
      })
    },
    [timeout],
  )

  return runDeprioritized
}

function interactionResponse(): Promise<unknown> {
  // Taken from https://github.com/vercel-labs/await-interaction-response/tree/main/packages/await-interaction-response/src

  return new Promise((resolve) => {
    setTimeout(resolve, 100) // Fallback for the case where the animation frame never fires.
    requestAnimationFrame(() => {
      setTimeout(resolve, 0)
    })
  })
}
