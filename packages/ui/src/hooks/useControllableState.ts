import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A hook for managing state that can be controlled by props but also overridden locally.
 * Props always win when they change, but local state can override temporarily.
 */
export function useControllableState<T>(
  propValue: T,
  defaultValue?: T,
): [T, (value: ((prev: T) => T) | T) => void] {
  const [localValue, setLocalValue] = useState<T>(propValue ?? defaultValue)
  const initialRenderRef = useRef(true)

  // Always sync with prop changes after initial render
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    // Sync with prop changes
    setLocalValue(propValue)
  }, [propValue])

  const setValue = useCallback((value: ((prev: T) => T) | T) => {
    setLocalValue(value)
  }, [])

  return [localValue, setValue]
}
