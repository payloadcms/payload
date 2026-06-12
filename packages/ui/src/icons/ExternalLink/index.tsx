import React from 'react'

import './index.css'

const paths = {
  // External link icon - box with arrow pointing out
  16: 'M4 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9a.5.5 0 0 0-1 0v3H4V4h3a.5.5 0 0 0 0-1H4zm5-.5a.5.5 0 0 1 .5-.5H13a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V3.707l-4.646 4.647a.5.5 0 1 1-.708-.708L11.793 3H9.5a.5.5 0 0 1-.5-.5',
  24: 'M6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4a.5.5 0 0 0-1 0v4H6V6h4a.5.5 0 0 0 0-1H6zm7-.5a.5.5 0 0 1 .5-.5H19a.5.5 0 0 1 .5.5V10a.5.5 0 0 1-1 0V5.707l-6.646 6.647a.5.5 0 0 1-.708-.708L17.793 5H13.5a.5.5 0 0 1-.5-.5',
}

export const ExternalLinkIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--external-link', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
