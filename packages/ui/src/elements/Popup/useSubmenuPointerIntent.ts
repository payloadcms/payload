import type { MouseEvent, RefObject } from 'react'

import { useCallback, useEffect, useRef } from 'react'

type UseSubmenuPointerIntentArgs = {
  contentRef: RefObject<HTMLElement | null>
  enabled: boolean
  onClose: () => void
  onOpen: () => void
}

export const useSubmenuPointerIntent = ({
  contentRef,
  enabled,
  onClose,
  onOpen,
}: UseSubmenuPointerIntentArgs) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = undefined
    }
  }, [])

  const handleEnter = useCallback(() => {
    cancelClose()
    onOpen()
  }, [cancelClose, onOpen])

  const handleLeave = useCallback(
    (event: MouseEvent) => {
      const target = event.relatedTarget as Node | null
      if (target && contentRef.current?.contains(target)) {
        cancelClose()
        return
      }

      cancelClose()
      closeTimer.current = setTimeout(() => {
        closeTimer.current = undefined
        onClose()
      }, 250)
    },
    [cancelClose, contentRef, onClose],
  )

  useEffect(() => {
    if (!enabled) {
      cancelClose()
    }
    return cancelClose
  }, [cancelClose, enabled])

  return {
    onMouseEnter: enabled ? handleEnter : undefined,
    onMouseLeave: enabled ? handleLeave : undefined,
  }
}
