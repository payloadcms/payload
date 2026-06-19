'use client'
import React, { useEffect, useRef } from 'react'

const baseClass = 'doc-header'

/**
 * Client wrapper for the document header that publishes its rendered height as the
 * `--doc-header-height` CSS variable, mirroring how `AppHeader` and `DocumentControls`
 * expose their own heights for layout calculations.
 *
 * @internal
 */
export const DocumentHeaderRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--doc-header-height', `${el.offsetHeight}px`)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--doc-header-height')
    }
  }, [])

  return (
    <div className={baseClass} ref={ref}>
      {children}
    </div>
  )
}
