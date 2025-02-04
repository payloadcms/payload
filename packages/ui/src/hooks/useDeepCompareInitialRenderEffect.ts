'use client'
import { dequal } from 'dequal/lite'
import { type DependencyList, useEffect, useRef } from 'react'

/**
 * Effect hook that compares the current and previous dependencies by value instead of reference.
 * On initial render, the effect will run regardless of deep equality of dependencies
 */
export const useDeepCompareInitialRenderEffect = (
  callback: () => void,
  deps: DependencyList,
): void => {
  const prevDeps = useRef(deps)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
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
  }, deps)
}
