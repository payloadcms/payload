'use client'
import React, { useRef } from 'react'

import { useElementHeightVariable } from '../../../hooks/useElementHeightVariable.js'

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

  useElementHeightVariable({ cssVar: '--doc-header-height', ref })

  return (
    <div className={baseClass} ref={ref}>
      {children}
    </div>
  )
}
