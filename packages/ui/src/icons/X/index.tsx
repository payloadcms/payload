import React from 'react'

import './index.css'

const paths = {
  // icon-16-close
  16: 'M4.854 4.146a.5.5 0 1 0-.708.708L7.293 8l-3.147 3.146a.5.5 0 0 0 .708.708L8 8.707l3.146 3.147a.5.5 0 0 0 .708-.708L8.707 8l3.147-3.146a.5.5 0 0 0-.708-.708L8 7.293z',
  // icon-24-close
  24: 'M16.1464 7.14611C16.3416 6.95092 16.6581 6.95102 16.8534 7.14611C17.0486 7.34137 17.0486 7.65789 16.8534 7.85314L12.7069 11.9996L16.8534 16.1461C17.0486 16.3414 17.0486 16.6579 16.8534 16.8531C16.6581 17.0484 16.3416 17.0484 16.1464 16.8531L11.9999 12.7067L7.85339 16.8531C7.65813 17.0484 7.34162 17.0484 7.14636 16.8531C6.95127 16.6579 6.95116 16.3413 7.14636 16.1461L11.2928 11.9996L7.14636 7.85314C6.95129 7.65787 6.95116 7.34131 7.14636 7.14611C7.34156 6.95096 7.65812 6.95106 7.85339 7.14611L11.9999 11.2926L16.1464 7.14611Z',
}

export const XIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={[className, 'icon icon--x'].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
