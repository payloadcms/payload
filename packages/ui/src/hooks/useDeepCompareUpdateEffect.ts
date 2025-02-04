'use client'
import { dequal } from 'dequal/lite'
import { type DependencyList, useRef } from 'react'

import { useUpdateEffect } from './useUpdateEffect.js'

/**
 * Effect hook that compares the current and previous dependencies by value instead of reference. Does not run on first render
 */
export const useDeepCompareUpdateEffect = (callback: () => void, deps: DependencyList): void => {
  const prevDeps = useRef(deps)

  useUpdateEffect(() => {
    const depsHaveChanged = deps.some((dep, index) => !dequal(dep, prevDeps.current[index]))

    if (depsHaveChanged) {
      callback()
    }

    prevDeps.current = deps
  }, deps)
}
