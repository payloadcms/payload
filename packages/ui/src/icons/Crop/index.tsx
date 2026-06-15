import React from 'react'

import './index.css'

// Paths from Figma icon library (fpl/components/src/icons/icon-24-crop.tsx)
const paths: Record<16 | 24, string> = {
  16: 'M3 3V9H5V5H9V3H3ZM13 7H11V11H7V13H13V7Z',
  24: 'M7.5 3a.5.5 0 0 1 .5.5V16h8V8H9.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 .5.5V16h3.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5V8H3.5a.5.5 0 0 1 0-1H7V3.5a.5.5 0 0 1 .5-.5m9 15a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5',
}

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
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
