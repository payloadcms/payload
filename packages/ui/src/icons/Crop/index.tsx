import React from 'react'

import './index.css'

const path =
  'M8.5 5a.5.5 0 0 1 .5.5V15h6V9h-4.5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-10a.5.5 0 0 1-.5-.5V9H5.5a.5.5 0 0 1 0-1H8V5.5a.5.5 0 0 1 .5-.5m7 12a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5'

export const CropIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
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
    <path clipRule="evenodd" d={path} fill="currentColor" fillRule="evenodd" />
  </svg>
)
