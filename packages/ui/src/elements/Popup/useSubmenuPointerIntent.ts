import type { PointerEvent, RefObject } from 'react'

import { useCallback, useEffect } from 'react'

import type { PointerPosition } from '../../hooks/usePointerSafeArea.js'

import { usePointerSafeArea } from '../../hooks/usePointerSafeArea.js'

type UseSubmenuPointerIntentArgs = {
  active: boolean
  contentRef: RefObject<HTMLElement | null>
  disabled?: boolean
  enabled: boolean
  onClose: () => void
  onOpen: () => void
  onSafeAreaExpire: (pointer: PointerPosition) => void
  triggerRef: RefObject<HTMLElement | null>
}

export const useSubmenuPointerIntent = ({
  active,
  contentRef,
  disabled = false,
  enabled,
  onClose,
  onOpen,
  onSafeAreaExpire,
  triggerRef,
}: UseSubmenuPointerIntentArgs) => {
  const isEnabled = enabled && !disabled

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
    enabled: isEnabled && active,
    from: triggerRef,
    onChange: renderSafeArea,
    onRelease: onSafeAreaExpire,
    to: contentRef,
  })
  const { clear, protect, trackSource, trackTarget } = safeArea

  const handleEnter = (event: PointerEvent) => {
    if (disabled || event.pointerType !== 'mouse') {
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
    if (disabled || event.pointerType !== 'mouse' || !active || !safeArea.isTracking()) {
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

  useEffect(() => {
    if (!isEnabled) {
      clear()
    }
  }, [clear, isEnabled])

  return {
    contentProps: {
      onPointerEnter: isEnabled ? handleEnter : undefined,
      onPointerLeave: isEnabled ? handleLeave : undefined,
    },
    isProtected: safeArea.isProtected,
    triggerProps: {
      onPointerEnter: isEnabled ? handleEnter : undefined,
      onPointerLeave: isEnabled ? handleLeave : undefined,
    },
    updateSafeArea: safeArea.refresh,
  }
}
