'use client'
import { useCallback, useEffect, useRef } from 'react'

import debounce from './debounce.js'

// Define the type for debounced function that includes cancel method
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>
  cancel: () => void
}

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  // Update the ref type to include cancel method
  const debouncedRef = useRef<DebouncedFunction<T> | null>(null)

  useEffect(() => {
    debouncedRef.current = debounce(fn, ms, { maxWait }) as DebouncedFunction<T>

    return () => {
      debouncedRef.current?.cancel()
    }
  }, [fn, ms, maxWait])

  const callback = useCallback((...args: Parameters<T>) => {
    if (debouncedRef.current) {
      debouncedRef.current(...args)
    }
  }, [])

  return callback
}
