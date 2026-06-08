import React from 'react'

import './index.css'

/**
 * Variable Color icon (24px, from Figma FPL icon.24.variable.color)
 * Used for the Theme menu row in the UserMenu.
 */
export const VariableColorIcon: React.FC<{
  readonly className?: string
  readonly size?: number
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--variable-color', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.972 5.316a9 9 0 0 1 12.391.32l.198.204a9 9 0 0 1 2.304 7.713C20.585 15.159 19.1 16 17.731 16H14a1 1 0 0 0-1 1v.5c0 .959-.396 1.867-1.065 2.474-.688.624-1.67.924-2.702.591a9 9 0 0 1-3.4-2.01l-.197-.192a9 9 0 0 1 0-12.727zm11.684 1.027A8 8 0 1 0 9.54 19.614c1.232.397 2.316-.595 2.446-1.858L12 17.5V17a2 2 0 0 1 2-2h3.731l.19-.007c.883-.066 1.68-.593 1.917-1.429l.042-.183a7.99 7.99 0 0 0-2.224-7.038M7.5 12a1.5 1.5 0 1 1-.001 3 1.5 1.5 0 0 1 0-3.001m0 1A.5.5 0 1 0 7.5 14a.5.5 0 0 0 0-1m9-3a1.5 1.5 0 1 1-.001 3 1.5 1.5 0 0 1 0-3m0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-8-4a1.5 1.5 0 1 1-.002 3.002A1.5 1.5 0 0 1 8.5 7m0 1a.5.5 0 1 0 .002 1.002A.5.5 0 0 0 8.5 8m5-2a1.5 1.5 0 1 1-.002 3 1.5 1.5 0 0 1 .002-3m0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1"
      fill="currentColor"
    />
  </svg>
)
