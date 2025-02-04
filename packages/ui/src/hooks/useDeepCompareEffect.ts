'use client'
import { dequal } from 'dequal/lite'
import { type DependencyList, useEffect, useRef } from 'react'

/**
 * Effect hook that compares the current and previous dependencies by value instead of reference
 */
export const useDeepCompareEffect = (callback: () => void, deps: DependencyList): void => {
  const prevDeps = useRef(deps)

  useEffect(() => {
    const depsHaveChanged = deps.some((dep, index) => !dequal(dep, prevDeps.current[index]))

    if (depsHaveChanged) {
      callback()
    }

    prevDeps.current = deps
  }, deps)
}
