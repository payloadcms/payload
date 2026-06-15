import React from 'react'

import './index.css'

export const DownloadIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    aria-hidden="true"
    className={['icon', 'icon--download', className].filter(Boolean).join(' ')}
    fill="none"
    focusable="false"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    {size === 24 ? (
      <>
        {/* Arrow with stem */}
        <path
          d="M13 3H11V13.17L8.41 10.59L7 12L12 17L17 12L15.59 10.59L13 13.17V3Z"
          fill="currentColor"
        />
        {/* Bottom bar */}
        <path d="M5 19H19V21H5V19Z" fill="currentColor" />
      </>
    ) : (
      <>
        <path d="M9 2H7V9.17L5.41 7.59L4 9L8 13L12 9L10.59 7.59L9 9.17V2Z" fill="currentColor" />
        <path d="M2 13H14V15H2V13Z" fill="currentColor" />
      </>
    )}
  </svg>
)
