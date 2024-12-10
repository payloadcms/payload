'use client'
import type { DependencyList } from 'react'

import { useEffect, useState } from 'react'

export function useDebouncedEffect(effect: () => void, deps: DependencyList, delay: number): void {
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
    debouncedEffect()
  }, [debouncedEffect])
}
