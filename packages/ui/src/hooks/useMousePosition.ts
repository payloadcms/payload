'use client'
import { useEffect, useState } from 'react'

import { useThrottledValue } from './useThrottledValue.js'

export type MousePosition = {
  x: number
  y: number
}

export type UseMousePositionOptions = {
  enabled?: boolean
  throttle?: number
}

/**
 * A hook that tracks the current mouse position when enabled.
 * @param options - Configuration options
 * @param options.enabled - Whether to track mouse position. Defaults to true.
 * @param options.throttle - Throttle delay in milliseconds. If not provided, position updates immediately.
 * @returns The current mouse position { x, y }
 */
export function useMousePosition(options: UseMousePositionOptions = {}): MousePosition {
  const { enabled = true, throttle } = options
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 })
  const throttledPosition = useThrottledValue(position, throttle ?? 0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enabled])

  return throttle ? throttledPosition : position
}
