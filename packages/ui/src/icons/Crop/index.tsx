import React from 'react'

import './index.css'

export const CropIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    aria-hidden="true"
    className={['icon', 'icon--crop', className].filter(Boolean).join(' ')}
    fill="none"
    focusable="false"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    {size === 24 ? (
      <>
        {/* Top-left L-bracket */}
        <path d="M4 4V12H6V6H12V4H4Z" fill="currentColor" />
        {/* Bottom-right L-bracket */}
        <path d="M20 12H18V18H12V20H20V12Z" fill="currentColor" />
      </>
    ) : (
      <>
        <path d="M3 3V9H5V5H9V3H3Z" fill="currentColor" />
        <path d="M13 7H11V11H7V13H13V7Z" fill="currentColor" />
      </>
    )}
  </svg>
)
