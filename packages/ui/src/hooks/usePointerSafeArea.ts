import type { RefObject } from 'react'

import { useCallback, useEffect, useRef } from 'react'

export type PointerPosition = { x: number; y: number }

type UsePointerSafeAreaArgs = {
  enabled: boolean
  from: RefObject<HTMLElement | null>
  idleTimeout?: number
  onChange: (args: { polygon: null | string }) => void
  onRelease: (pointer: PointerPosition) => void
  to: RefObject<HTMLElement | null>
}

/** Tracks a safe area for pointer travel between two elements in either direction. */
export const usePointerSafeArea = ({
  enabled,
  from,
  idleTimeout = 300,
  onChange,
  onRelease,
  to,
}: UsePointerSafeAreaArgs) => {
  const origin = useRef<PointerPosition | undefined>(undefined)
  const isReturning = useRef(false)
  const isProtected = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const callbacks = useRef({ onChange, onRelease })

  useEffect(() => {
    callbacks.current = { onChange, onRelease }
  }, [onChange, onRelease])

  const clear = useCallback(() => {
    clearTimeout(idleTimer.current)
    idleTimer.current = undefined
    if (isProtected.current) {
      isProtected.current = false
      callbacks.current.onChange({ polygon: null })
    }
    origin.current = undefined
  }, [])

  const release = useCallback(
    (pointer: PointerPosition) => {
      clear()
      callbacks.current.onRelease(pointer)
    },
    [clear],
  )

  const update = useCallback(
    ({ pointer }: { pointer?: PointerPosition } = {}) => {
      const target = isReturning.current ? from.current : to.current
      const start = origin.current

      if (!enabled || !target || !start || (!pointer && !isProtected.current)) {
        return false
      }

      const rect = target.getBoundingClientRect()
      if (rect.left <= start.x && rect.right >= start.x) {
        return false
      }
      const points = getSafeAreaPoints({ rect, start })

      if (
        pointer &&
        !points.every(
          (point, index) =>
            getCrossProduct({ a: point, b: points[(index + 1) % points.length], point: pointer }) >=
            0,
        )
      ) {
        return false
      }

      isProtected.current = true
      callbacks.current.onChange({
        polygon: `polygon(${points.map(({ x, y }) => `${x}px ${y}px`).join(', ')})`,
      })
      if (pointer) {
        clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(() => release(pointer), idleTimeout)
      }
      return true
    },
    [enabled, from, idleTimeout, release, to],
  )

  const trackSource = useCallback(
    (pointer: PointerPosition) => {
      clear()
      origin.current = pointer
      isReturning.current = false
    },
    [clear],
  )

  const trackTarget = useCallback(
    (pointer: PointerPosition) => {
      // A keyboard-opened target does not start pointer tracking on its own.
      if (!origin.current) {
        return
      }
      clear()
      origin.current = pointer
      isReturning.current = true
    },
    [clear],
  )

  useEffect(() => {
    if (!enabled) {
      clear()
      return
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !origin.current) {
        return
      }
      const pointer = { x: event.clientX, y: event.clientY }
      const target = event.target as Node | null

      if (target && from.current?.contains(target)) {
        trackSource(pointer)
      } else if (target && to.current?.contains(target)) {
        trackTarget(pointer)
      } else if (isProtected.current && !update({ pointer })) {
        release(pointer)
      }
    }
    const handlePress = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        // Preserve tracking after clicks that keep either endpoint open, while
        // letting clicks elsewhere reach their target without sending a replacement event.
        const pointer = { x: event.clientX, y: event.clientY }
        const target = event.target as Node | null

        if (target && from.current?.contains(target)) {
          trackSource(pointer)
        } else if (target && to.current?.contains(target)) {
          trackTarget(pointer)
        } else {
          clear()
        }
      }
    }
    const document = from.current?.ownerDocument

    document?.addEventListener('pointermove', handleMove, { capture: true, passive: true })
    document?.addEventListener('pointerdown', handlePress, { capture: true, passive: true })
    return () => {
      document?.removeEventListener('pointermove', handleMove, { capture: true })
      document?.removeEventListener('pointerdown', handlePress, { capture: true })
      clear()
    }
  }, [clear, enabled, from, release, to, trackSource, trackTarget, update])

  return {
    clear,
    isProtected: useCallback(() => isProtected.current, []),
    isTracking: useCallback(() => origin.current !== undefined, []),
    protect: ({ pointer }: { pointer: PointerPosition }) => update({ pointer }),
    refresh: () => update(),
    trackSource,
    trackTarget,
  }
}

// The convex hull covers the whole destination, allowing return paths to enter
// through its top or bottom as well as its nearest edge.
const getSafeAreaPoints = ({ rect, start }: { rect: DOMRect; start: PointerPosition }) => {
  const points = [
    { x: start.x, y: start.y - 4 },
    { x: start.x, y: start.y + 4 },
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ].sort((a, b) => a.x - b.x || a.y - b.y)
  const getOuterEdge = ({ orderedPoints }: { orderedPoints: PointerPosition[] }) => {
    const edge: PointerPosition[] = []

    for (const point of orderedPoints) {
      while (
        edge.length > 1 &&
        getCrossProduct({ a: edge[edge.length - 2], b: edge[edge.length - 1], point }) <= 0
      ) {
        edge.pop()
      }
      edge.push(point)
    }
    return edge.slice(0, -1)
  }

  return [
    ...getOuterEdge({ orderedPoints: points }),
    ...getOuterEdge({ orderedPoints: [...points].reverse() }),
  ]
}

const getCrossProduct = ({
  a,
  b,
  point,
}: {
  a: PointerPosition
  b: PointerPosition
  point: PointerPosition
}) => (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
