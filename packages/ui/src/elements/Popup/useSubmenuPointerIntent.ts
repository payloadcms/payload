import type { PointerEvent, RefObject } from 'react'

import { useCallback, useEffect, useRef } from 'react'

import type { PointerPosition } from '../../hooks/usePointerCorridor.js'

import { usePointerCorridor } from '../../hooks/usePointerCorridor.js'

type UseSubmenuPointerIntentArgs = {
  active: boolean
  contentRef: RefObject<HTMLElement | null>
  enabled: boolean
  onClose: () => void
  onOpen: () => void
  onSafeAreaExpire: (pointer: PointerPosition) => void
  triggerRef: RefObject<HTMLElement | null>
}

export const useSubmenuPointerIntent = ({
  active,
  contentRef,
  enabled,
  onClose,
  onOpen,
  onSafeAreaExpire,
  triggerRef,
}: UseSubmenuPointerIntentArgs) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const renderCorridor = useCallback(
    ({ polygon }: { polygon: null | string }) => {
      const content = contentRef.current

      if (polygon) {
        content?.style.setProperty('--popup-safe-area', polygon)
        content?.setAttribute('data-submenu-safe-area', '')
      } else {
        content?.style.removeProperty('--popup-safe-area')
        content?.removeAttribute('data-submenu-safe-area')
      }
    },
    [contentRef],
  )

  const corridor = usePointerCorridor({
    enabled: enabled && active,
    from: triggerRef,
    onChange: renderCorridor,
    onIdle: onSafeAreaExpire,
    to: contentRef,
  })
  const { clear, protect, refresh, trackSource, trackTarget } = corridor

  const handleContentMove = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        trackTarget({ x: event.clientX, y: event.clientY })
      }
    },
    [trackTarget],
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
        trackSource({ x: event.clientX, y: event.clientY })
      }
      onOpen()
    },
    [cancelClose, contentRef, onOpen, trackSource],
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
        protect({ pointer: { x: event.clientX, y: event.clientY } })
      ) {
        cancelClose()
        return
      }

      clear()
      cancelClose()
      closeTimer.current = setTimeout(() => {
        closeTimer.current = undefined
        onClose()
      }, 250)
    },
    [cancelClose, clear, contentRef, onClose, protect],
  )

  useEffect(() => {
    if (!enabled || !active) {
      cancelClose()
    }
    return cancelClose
  }, [active, cancelClose, enabled])

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
    updateSafeArea: refresh,
  }
}
