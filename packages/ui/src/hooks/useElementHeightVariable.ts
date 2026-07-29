'use client'

import type { RefObject } from 'react'

import { useEffect } from 'react'

/**
 * Observes an element and publishes its rendered height to a CSS custom property on the document
 * root (e.g. `--app-header-height`), so layout that depends on that height can be expressed in CSS.
 * The property is removed on unmount.
 *
 * Used by `AppHeader`, `DocumentControls` and `DocumentHeaderRoot` to expose their heights for
 * sticky offsets and the upload view's scroll-driven sizing.
 */
export const useElementHeightVariable = ({
  cssVar,
  isEnabled = true,
  ref,
}: {
  cssVar: string
  isEnabled?: boolean
  ref: RefObject<HTMLElement | null>
}): void => {
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const el = ref.current
    if (!el) {
      return
    }

    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(cssVar, `${el.offsetHeight}px`)
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty(cssVar)
    }
  }, [cssVar, isEnabled, ref])
}
