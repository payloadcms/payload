import React from 'react'

import './index.css'

// Minimized state paths - corners pointing outward (expand)
const minimizedPaths = {
  16: 'M4 3.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 1H4.5V5.5a.5.5 0 0 1-1 0V3.5zM12 3.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V4h-1a.5.5 0 0 1-.5-.5zM4 10.5a.5.5 0 0 1 1 0V12h1.5a.5.5 0 0 1 0 1H4.5a.5.5 0 0 1-.5-.5v-2zm9.5 0a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5H12a.5.5 0 0 1 0-1h1V10.5z',
  24: 'M6 5a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 0 1H6.5V7a.5.5 0 0 1-1 0V5.5A.5.5 0 0 1 6 5zm10 0a.5.5 0 0 1 .5-.5H18a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V5.5H16a.5.5 0 0 1-.5-.5zM6 16.5a.5.5 0 0 1 1 0V18h1.5a.5.5 0 0 1 0 1H6.5a.5.5 0 0 1-.5-.5v-2zm11.5 0a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5H16a.5.5 0 0 1 0-1h1.5v-1.5z',
}

// Maximized state paths - corners pointing inward (collapse)
const maximizedPaths = {
  16: 'M6 3a.5.5 0 0 1 .5.5V5a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1H5V3.5A.5.5 0 0 1 5.5 3H6zm4.5 0a.5.5 0 0 1 .5.5V4h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H10a.5.5 0 0 1-.5-.5V3.5a.5.5 0 0 1 .5-.5zM6 10a.5.5 0 0 1 .5.5V11H5v-.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 0-.5.5V12a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1H5v-.5a.5.5 0 0 1 .5-.5H6zm4.5.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12v1a.5.5 0 0 1-1 0v-1.5z',
  24: 'M8 5a.5.5 0 0 1 .5.5V7a.5.5 0 0 1-.5.5H6.5a.5.5 0 0 1 0-1H7V5.5A.5.5 0 0 1 7.5 5H8zm8.5 0a.5.5 0 0 1 .5.5V6.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H16a.5.5 0 0 1-.5-.5V5.5a.5.5 0 0 1 .5-.5zM8 16a.5.5 0 0 1 .5.5V18a.5.5 0 0 1-.5.5H6.5a.5.5 0 0 1 0-1H7v-1a.5.5 0 0 1 .5-.5H8zm8.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V18a.5.5 0 0 1-.5.5H16a.5.5 0 0 1 0-1h1.5v-1z',
}

export const MinimizeMaximizeIcon: React.FC<{
  readonly className?: string
  readonly isMinimized?: boolean
  readonly size?: 16 | 24
}> = ({ className, isMinimized, size = 24 }) => {
  const pathData = isMinimized ? minimizedPaths[size] : maximizedPaths[size]

  return (
    <svg
      className={[
        'icon',
        'icon--minimize-maximize',
        isMinimized ? 'icon--minimize-maximize--minimized' : 'icon--minimize-maximize--maximized',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path clipRule="evenodd" d={pathData} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
