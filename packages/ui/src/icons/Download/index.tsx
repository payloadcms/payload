import React from 'react'

import './index.css'

// Paths from Figma icon library
// 24px: fpl/components/src/icons/icon-24-export-small.tsx
// 16px: fpl/components/src/icons/icon-16-download.tsx
const paths: Record<16 | 24, string> = {
  16: 'M8 2.5a.5.5 0 0 0-1 0v5.793L5.354 6.646a.5.5 0 1 0-.707.708l2.5 2.5a.5.5 0 0 0 .707 0l2.5-2.5a.5.5 0 0 0-.707-.708L8 8.293zm-4 8a.5.5 0 0 0-1 0v1A1.5 1.5 0 0 0 4.5 13h6a1.5 1.5 0 0 0 1.5-1.5v-1a.5.5 0 0 0-1 0v1a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5z',
  24: 'M12 6.5a.5.5 0 0 0-1 0v5.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L12 12.293zm-5 7a.5.5 0 0 0-1 0v3A1.5 1.5 0 0 0 7.5 18h8a1.5 1.5 0 0 0 1.5-1.5v-3a.5.5 0 0 0-1 0v3a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5z',
}

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
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
