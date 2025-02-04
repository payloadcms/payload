'use client'
import type { DependencyList } from 'react'

import { useEffect, useRef, useState } from 'react'

/**
 * Run a debounced effect only on updates, not on the first render
 */
export function useUpdateDebouncedEffect(
  effect: () => void,
  deps: DependencyList,
  delay: number,
): void {
  const isFirstRenderRef = useRef(true)

  const [debouncedEffect, setDebouncedEffect] = useState<() => void>(() => effect)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEffect(() => effect)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [...deps, delay])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    debouncedEffect()
  }, [debouncedEffect])
}
