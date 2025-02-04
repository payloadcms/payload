'use client'
import type { DependencyList } from 'react'

import { useEffect, useState } from 'react'

import { useUpdateEffect } from './useUpdateEffect.js'

/**
 * Run a debounced effect only on updates, not on the first render
 */
export function useUpdateDebouncedEffect(
  effect: () => void,
  deps: DependencyList,
  delay: number,
): void {
  const [debouncedEffect, setDebouncedEffect] = useState<() => void>(() => effect)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEffect(() => effect)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [...deps, delay])

  useUpdateEffect(() => {
    debouncedEffect()
  }, [debouncedEffect])
}
