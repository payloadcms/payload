import type { PointerEvent, RefObject } from 'react'

import { useCallback, useEffect, useRef } from 'react'

type UseSubmenuPointerIntentArgs = {
  active: boolean
  contentRef: RefObject<HTMLElement | null>
  enabled: boolean
  onClose: () => void
  onOpen: () => void
  onSafeAreaExpire: (pointer: PointerPosition) => void
}

type PointerPosition = { x: number; y: number }

const SAFE_AREA_TIMEOUT_MS = 300

export const useSubmenuPointerIntent = ({
  active,
  contentRef,
  enabled,
  onClose,
  onOpen,
  onSafeAreaExpire,
}: UseSubmenuPointerIntentArgs) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerOrigin = useRef<PointerPosition | undefined>(undefined)
  const latestPointer = useRef<PointerPosition | undefined>(undefined)
  const triggerBounds = useRef<DOMRect | undefined>(undefined)
  const safeAreaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cancelSafeAreaTimeout = useCallback(() => {
    if (safeAreaTimer.current) {
      clearTimeout(safeAreaTimer.current)
      safeAreaTimer.current = undefined
    }
  }, [])

  const clearSafeArea = useCallback(() => {
    cancelSafeAreaTimeout()
    contentRef.current?.style.removeProperty('--popup-safe-area')
    contentRef.current?.removeAttribute('data-submenu-safe-area')
    pointerOrigin.current = undefined
    latestPointer.current = undefined
    triggerBounds.current = undefined
  }, [cancelSafeAreaTimeout, contentRef])

  const updateSafeAreaTimeout = useCallback(
    ({ x, y }: PointerPosition) => {
      latestPointer.current = { x, y }
      const bounds = triggerBounds.current

      cancelSafeAreaTimeout()
      if (!bounds || (y >= bounds.top && y <= bounds.bottom)) {
        return
      }

      // Keep slow movement protected; release the corridor only after inactivity
      // outside the trigger row, then reconcile the stationary pointer's item.
      safeAreaTimer.current = setTimeout(() => {
        const pointer = latestPointer.current

        clearSafeArea()
        if (pointer) {
          onSafeAreaExpire(pointer)
        }
      }, SAFE_AREA_TIMEOUT_MS)
    },
    [cancelSafeAreaTimeout, clearSafeArea, onSafeAreaExpire],
  )

  const updateSafeArea = useCallback(
    ({ pointer }: { pointer?: PointerPosition } = {}) => {
      const content = contentRef.current
      const origin = pointerOrigin.current

      if (
        !enabled ||
        !active ||
        !content ||
        !origin ||
        !content.matches(':popover-open') ||
        (!pointer && !content.hasAttribute('data-submenu-safe-area'))
      ) {
        return false
      }

      const rect = content.getBoundingClientRect()
      const isOnRight = rect.left > origin.x
      const isOnLeft = rect.right < origin.x

      if (!isOnRight && !isOnLeft) {
        clearSafeArea()
        return false
      }

      const edgeX = isOnRight ? rect.left : rect.right

      if (pointer) {
        const progress = (pointer.x - origin.x) / (edgeX - origin.x)
        const top = origin.y - 4 + (rect.top - origin.y + 4) * progress
        const bottom = origin.y + 4 + (rect.bottom - origin.y - 4) * progress

        // Only protect departures toward the menu and inside its corridor. Vertical
        // travel and jumps elsewhere must still reach the underlying parent items.
        if (progress <= 0 || progress >= 1 || pointer.y < top || pointer.y > bottom) {
          return false
        }
      }

      content.style.setProperty(
        '--popup-safe-area',
        `polygon(${origin.x}px ${origin.y - 4}px, ${edgeX}px ${rect.top}px, ${edgeX}px ${rect.bottom}px, ${origin.x}px ${origin.y + 4}px)`,
      )
      content.setAttribute('data-submenu-safe-area', '')
      if (pointer) {
        updateSafeAreaTimeout(pointer)
      }
      return true
    },
    [active, clearSafeArea, contentRef, enabled, updateSafeAreaTimeout],
  )

  const handleTriggerMove = useCallback((event: PointerEvent) => {
    if (event.pointerType !== 'mouse') {
      return
    }

    pointerOrigin.current = { x: event.clientX, y: event.clientY }
    triggerBounds.current ??= event.currentTarget.getBoundingClientRect()
  }, [])

  const handleContentMove = useCallback(
    (event: PointerEvent) => {
      const content = contentRef.current

      if (event.pointerType !== 'mouse' || !content?.hasAttribute('data-submenu-safe-area')) {
        return
      }

      const rect = content.getBoundingClientRect()

      // The pseudo-element also receives these events. Retire the corridor only once
      // the pointer reaches the actual menu, allowing a direct return to the parent.
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        clearSafeArea()
      } else {
        updateSafeAreaTimeout({ x: event.clientX, y: event.clientY })
      }
    },
    [clearSafeArea, contentRef, updateSafeAreaTimeout],
  )

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = undefined
    }
  }, [])

  const handleEnter = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return
      }

      cancelClose()
      if (event.currentTarget !== contentRef.current) {
        handleTriggerMove(event)
      }
      onOpen()
    },
    [cancelClose, contentRef, handleTriggerMove, onOpen],
  )

  const handleLeave = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return
      }

      const target = event.relatedTarget as Node | null
      if (target && contentRef.current?.contains(target)) {
        cancelClose()
        return
      }

      if (
        event.currentTarget !== contentRef.current &&
        updateSafeArea({ pointer: { x: event.clientX, y: event.clientY } })
      ) {
        cancelClose()
        return
      }

      clearSafeArea()
      cancelClose()
      closeTimer.current = setTimeout(() => {
        closeTimer.current = undefined
        onClose()
      }, 250)
    },
    [cancelClose, clearSafeArea, contentRef, onClose, updateSafeArea],
  )

  useEffect(() => {
    if (!enabled || !active) {
      cancelClose()
      clearSafeArea()
    }
    return () => {
      cancelClose()
      cancelSafeAreaTimeout()
    }
  }, [active, cancelClose, cancelSafeAreaTimeout, clearSafeArea, enabled])

  return {
    contentProps: {
      onPointerEnter: enabled ? handleEnter : undefined,
      onPointerLeave: enabled ? handleLeave : undefined,
      onPointerMove: enabled ? handleContentMove : undefined,
    },
    triggerProps: {
      onPointerEnter: enabled ? handleEnter : undefined,
      onPointerLeave: enabled ? handleLeave : undefined,
      onPointerMove: enabled ? handleEnter : undefined,
    },
    updateSafeArea,
  }
}
