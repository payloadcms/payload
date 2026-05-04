import React from 'react'

import './index.css'

const paths = {
  16: 'M4 4h3v1H4zM3 5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm5 1H4v5h8V6z',
  24: 'M7 7h3.882l.5 1H7zM6 8V7a1 1 0 0 1 1-1h3.882a1 1 0 0 1 .894.553L12.5 8h4A1.5 1.5 0 0 1 18 9.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 15.5zm7 1H7v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5z',
}

export const FolderIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--folder', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
