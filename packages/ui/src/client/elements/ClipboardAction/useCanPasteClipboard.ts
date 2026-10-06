'use client'
import { useCallback, useRef, useState } from 'react'

import type { ClipboardPasteEligibilityArgs } from './types.js'

import { canPasteClipboardData } from './clipboardUtilities.js'

/**
 * Tracks whether the clipboard contents can be pasted into the target field.
 * Call `refresh` when a paste menu opens to re-check against the field's schema.
 */
export function useCanPasteClipboard(args: ClipboardPasteEligibilityArgs): {
  canPaste: boolean
  refresh: () => void
} {
  const [canPaste, setCanPaste] = useState<boolean>(false)

  const argsRef = useRef(args)
  argsRef.current = args

  const refresh = useCallback(() => {
    setCanPaste(canPasteClipboardData(argsRef.current))
  }, [])

  return { canPaste, refresh }
}
