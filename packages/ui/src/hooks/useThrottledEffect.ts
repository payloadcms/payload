'use client'
import type React from 'react'

import { useEffect, useRef, useState } from 'react'

type useThrottledEffect = (
  callback: React.EffectCallback,
  delay: number,
  deps: React.DependencyList,
) => void

/**
 * A hook that will throttle the execution of a callback function inside a useEffect.
 * This is useful for things like throttling loading states or other UI updates.
 * @param callback The callback function to be executed.
 * @param delay The delay in milliseconds to throttle the callback.
 * @param deps The dependencies to watch for changes.
 */
export const useThrottledEffect: useThrottledEffect = (callback, delay, deps = []) => {
  // Render can't read the current time, so a lazy initializer reads it once
  const [mountedAt] = useState(() => Date.now())
  const lastRan = useRef(mountedAt)

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= delay) {
          callback()
          lastRan.current = Date.now()
        }
      },
      delay - (Date.now() - lastRan.current),
    )

    return () => {
      clearTimeout(handler)
    }
  }, [delay, ...deps])
}
