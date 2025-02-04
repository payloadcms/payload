'use client'
import { dequal } from 'dequal/lite'
import { type DependencyList, useRef } from 'react'

import { useDebouncedEffect } from './useDebouncedEffect.js'

/**
 * Debounced effect hook that compares the current and previous dependencies by value instead of reference.
 * On initial render, the effect will run regardless of deep equality of dependencies
 */
export const useDebouncedDeepCompareInitialRenderEffect = (
  callback: () => void,
  deps: DependencyList,
  delay: number,
): void => {
  const prevDeps = useRef(deps)
  const isFirstRenderRef = useRef(true)

  useDebouncedEffect(
    () => {
      if (isFirstRenderRef.current) {
        callback()
        isFirstRenderRef.current = false
        return
      }

      const depsHaveChanged = deps.some((dep, index) => !dequal(dep, prevDeps.current[index]))

      if (depsHaveChanged) {
        callback()
      }

      prevDeps.current = deps
    },
    deps,
    delay,
  )
}
