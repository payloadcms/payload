import React from 'react'

import './index.css'

// Minimized state paths - corners pointing outward (expand)
const minimizedPaths = {
  16: 'M4 3.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 1H4.5V5.5a.5.5 0 0 1-1 0V3.5zM12 3.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V4h-1a.5.5 0 0 1-.5-.5zM4 10.5a.5.5 0 0 1 1 0V12h1.5a.5.5 0 0 1 0 1H4.5a.5.5 0 0 1-.5-.5v-2zm9.5 0a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5H12a.5.5 0 0 1 0-1h1V10.5z',
  24: 'M10.1465 13.1465C10.3417 12.9512 10.6583 12.9512 10.8535 13.1465C11.0488 13.3417 11.0488 13.6583 10.8535 13.8535L7.70703 17H10.5C10.7761 17 11 17.2239 11 17.5C11 17.7761 10.7761 18 10.5 18H6.5C6.22386 18 6 17.7761 6 17.5V13.5C6 13.2239 6.22386 13 6.5 13C6.77614 13 7 13.2239 7 13.5V16.293L10.1465 13.1465ZM17.5 6C17.7761 6 18 6.22386 18 6.5V10.5C18 10.7761 17.7761 11 17.5 11C17.2239 11 17 10.7761 17 10.5V7.70703L13.8535 10.8535C13.6583 11.0488 13.3417 11.0488 13.1465 10.8535C12.9512 10.6583 12.9512 10.3417 13.1465 10.1465L16.293 7H13.5C13.2239 7 13 6.77614 13 6.5C13 6.22386 13.2239 6 13.5 6H17.5Z',
}

// Maximized state paths - corners pointing inward (collapse)
const maximizedPaths = {
  16: 'M6 3a.5.5 0 0 1 .5.5V5a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1H5V3.5A.5.5 0 0 1 5.5 3H6zm4.5 0a.5.5 0 0 1 .5.5V4h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H10a.5.5 0 0 1-.5-.5V3.5a.5.5 0 0 1 .5-.5zM6 10a.5.5 0 0 1 .5.5V11H5v-.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 0-.5.5V12a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1H5v-.5a.5.5 0 0 1 .5-.5H6zm4.5.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12v1a.5.5 0 0 1-1 0v-1.5z',
  24: 'M10.5 13C10.7761 13 11 13.2239 11 13.5V17.5C11 17.7761 10.7761 18 10.5 18C10.2239 18 10 17.7761 10 17.5V14.707L6.85352 17.8535C6.65825 18.0488 6.34175 18.0488 6.14648 17.8535C5.95122 17.6583 5.95122 17.3417 6.14648 17.1465L9.29297 14H6.5C6.22386 14 6 13.7761 6 13.5C6 13.2239 6.22386 13 6.5 13H10.5ZM17.1465 6.14648C17.3417 5.95122 17.6583 5.95122 17.8535 6.14648C18.0488 6.34175 18.0488 6.65825 17.8535 6.85352L14.707 10H17.5C17.7761 10 18 10.2239 18 10.5C18 10.7761 17.7761 11 17.5 11H13.5C13.2239 11 13 10.7761 13 10.5V6.5C13 6.22386 13.2239 6 13.5 6C13.7761 6 14 6.22386 14 6.5V9.29297L17.1465 6.14648Z',
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
