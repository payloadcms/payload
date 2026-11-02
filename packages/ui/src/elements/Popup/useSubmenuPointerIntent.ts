import type { PointerEvent, RefObject } from 'react'

import { useCallback } from 'react'

import type { PointerPosition } from '../../hooks/usePointerSafeArea.js'

import { usePointerSafeArea } from '../../hooks/usePointerSafeArea.js'

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
  const renderSafeArea = useCallback(
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

  const safeArea = usePointerSafeArea({
    enabled: enabled && active,
    from: triggerRef,
    onChange: renderSafeArea,
    onRelease: onSafeAreaExpire,
    to: contentRef,
  })
  const { clear, protect, trackSource, trackTarget } = safeArea

  const handleEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') {
      return
    }
    const pointer = { x: event.clientX, y: event.clientY }

    if (event.currentTarget === contentRef.current) {
      trackTarget(pointer)
    } else {
      trackSource(pointer)
      onOpen()
    }
  }

  const handleLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !active || !safeArea.isTracking()) {
      return
    }
    const target = event.relatedTarget as Node | null

    if (target && (contentRef.current?.contains(target) || triggerRef.current?.contains(target))) {
      return
    }
    if (!protect({ pointer: { x: event.clientX, y: event.clientY } })) {
      clear()
      onClose()
    }
  }

  return {
    contentProps: {
      onPointerEnter: enabled ? handleEnter : undefined,
      onPointerLeave: enabled ? handleLeave : undefined,
    },
    isProtected: safeArea.isProtected,
    triggerProps: {
      onPointerEnter: enabled ? handleEnter : undefined,
      onPointerLeave: enabled ? handleLeave : undefined,
    },
    updateSafeArea: safeArea.refresh,
  }
}
