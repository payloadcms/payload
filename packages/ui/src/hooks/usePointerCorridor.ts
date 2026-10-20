import type { RefObject } from 'react'

import { useCallback, useEffect, useRef } from 'react'

export type PointerPosition = { x: number; y: number }

type UsePointerCorridorArgs = {
  enabled: boolean
  from: RefObject<HTMLElement | null>
  idleTimeout?: number
  onChange: (args: { polygon: null | string }) => void
  onIdle: (pointer: PointerPosition) => void
  to: RefObject<HTMLElement | null>
}

/**
 * Tracks a horizontal hover corridor independently of its renderer and hover behavior.
 * Reports a clip-path polygon in viewport coordinates; the caller renders and clears it.
 */
export const usePointerCorridor = ({
  enabled,
  from,
  idleTimeout = 300,
  onChange,
  onIdle,
  to,
}: UsePointerCorridorArgs) => {
  const origin = useRef<PointerPosition | undefined>(undefined)
  const latestPointer = useRef<PointerPosition | undefined>(undefined)
  const sourceBounds = useRef<DOMRect | undefined>(undefined)
  const isProtected = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const callbacks = useRef({ onChange, onIdle })

  useEffect(() => {
    callbacks.current = { onChange, onIdle }
  }, [onChange, onIdle])

  const cancelIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = undefined
    }
  }, [])

  const clear = useCallback(() => {
    cancelIdle()
    if (isProtected.current) {
      isProtected.current = false
      callbacks.current.onChange({ polygon: null })
    }
    origin.current = undefined
    latestPointer.current = undefined
    sourceBounds.current = undefined
  }, [cancelIdle])

  const updateIdle = useCallback(
    (pointer: PointerPosition) => {
      latestPointer.current = pointer
      const bounds = sourceBounds.current

      cancelIdle()
      if (!bounds || (pointer.y >= bounds.top && pointer.y <= bounds.bottom)) {
        return
      }

      idleTimer.current = setTimeout(() => {
        const pointer = latestPointer.current

        clear()
        if (pointer) {
          callbacks.current.onIdle(pointer)
        }
      }, idleTimeout)
    },
    [cancelIdle, clear, idleTimeout],
  )

  const update = useCallback(
    ({ pointer }: { pointer?: PointerPosition } = {}) => {
      const target = to.current
      const start = origin.current

      if (!enabled || !from.current || !target || !start || (!pointer && !isProtected.current)) {
        return false
      }

      const rect = target.getBoundingClientRect()
      const isOnRight = rect.left > start.x
      const isOnLeft = rect.right < start.x

      if (!isOnRight && !isOnLeft) {
        clear()
        return false
      }

      const edgeX = isOnRight ? rect.left : rect.right

      if (pointer) {
        const progress = (pointer.x - start.x) / (edgeX - start.x)
        const top = start.y - 4 + (rect.top - start.y + 4) * progress
        const bottom = start.y + 4 + (rect.bottom - start.y - 4) * progress

        // Only protect travel toward the target; vertical departures remain unobstructed.
        if (progress <= 0 || progress >= 1 || pointer.y < top || pointer.y > bottom) {
          return false
        }
      }

      isProtected.current = true
      callbacks.current.onChange({
        polygon: `polygon(${start.x}px ${start.y - 4}px, ${edgeX}px ${rect.top}px, ${edgeX}px ${rect.bottom}px, ${start.x}px ${start.y + 4}px)`,
      })
      if (pointer) {
        updateIdle(pointer)
      }
      return true
    },
    [clear, enabled, from, to, updateIdle],
  )

  // Tracking can precede enabling protection, e.g. when entering the source opens the target.
  const trackSource = useCallback(
    (pointer: PointerPosition) => {
      origin.current = pointer
      sourceBounds.current ??= from.current?.getBoundingClientRect()
    },
    [from],
  )

  const trackTarget = useCallback(
    (pointer: PointerPosition) => {
      if (!isProtected.current || !to.current) {
        return
      }

      const rect = to.current.getBoundingClientRect()

      if (
        pointer.x >= rect.left &&
        pointer.x <= rect.right &&
        pointer.y >= rect.top &&
        pointer.y <= rect.bottom
      ) {
        clear()
      } else {
        updateIdle(pointer)
      }
    },
    [clear, to, updateIdle],
  )

  useEffect(() => {
    if (!enabled) {
      clear()
    }
  }, [clear, enabled])

  useEffect(() => clear, [clear, from, to])

  return {
    clear,
    protect: ({ pointer }: { pointer: PointerPosition }) => update({ pointer }),
    refresh: () => update(),
    trackSource,
    trackTarget,
  }
}
