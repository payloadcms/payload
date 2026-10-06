'use client'

import { useEffect, useRef, useState } from 'react'

export function useRowFocus() {
  const fieldRef = useRef<HTMLDivElement>(null)
  const [rowID, setRowID] = useState<null | string>(null)

  useEffect(() => {
    if (!rowID) {
      return
    }

    // Wait for the inserted row to render and the picker to restore focus on closing.
    const timer = setTimeout(() => {
      const toggle = fieldRef.current?.querySelector<HTMLButtonElement>(
        `#${CSS.escape(rowID)} .collapsible__toggle`,
      )

      toggle?.focus({ preventScroll: true })
      toggle?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setRowID(null)
    }, 0)

    return () => clearTimeout(timer)
  }, [rowID])

  return { fieldRef, focusRow: setRowID }
}
