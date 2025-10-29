'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * A hook for managing state that can be controlled by props but also overridden locally.
 * Props always take precedence if they change, but local state can override them temporarily.
 *
 * @internal - may change or be removed without a major version bump
 */
export function useControllableState<T, D>(
  propValue: T,
  defaultValue: D,
): [T extends NonNullable<T> ? T : D | NonNullable<T>, (value: ((prev: T) => T) | T) => void]
export function useControllableState<T>(propValue: T): [T, (value: ((prev: T) => T) | T) => void]
export function useControllableState<T, D>(
  propValue: T,
  defaultValue?: D,
): [T extends NonNullable<T> ? T : D | NonNullable<T>, (value: ((prev: T) => T) | T) => void] {
  const [localValue, setLocalValue] = useState<T>(propValue)
  const initialRenderRef = useRef(true)

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    setLocalValue(propValue)
  }, [propValue])

  return [localValue ?? defaultValue, setLocalValue] as [
    T extends NonNullable<T> ? T : D | NonNullable<T>,
    (value: ((prev: T) => T) | T) => void,
  ]
}
