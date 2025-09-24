import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A hook for managing state that can be controlled by props but also overridden locally.
 * Props always take precedence if they change, but local state can override them temporarily.
 */
export function useControllableState<T>(
  propValue: T,
  defaultValue?: T,
): [T, (value: ((prev: T) => T) | T) => void] {
  const [localValue, setLocalValue] = useState<T>(propValue ?? defaultValue)
  const initialRenderRef = useRef(true)

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    setLocalValue(propValue)
  }, [propValue])

  const setValue = useCallback((value: ((prev: T) => T) | T) => {
    setLocalValue(value)
  }, [])

  return [localValue, setValue]
}
