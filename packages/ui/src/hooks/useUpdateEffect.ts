'use client'
import { type DependencyList, useEffect, useRef } from 'react'

/**
 * Run an effect only on updates, not on the first render
 */
export const useUpdateEffect = (callback: () => void, deps: DependencyList): void => {
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    callback()
  }, deps)
}
