import React from 'react'

import './index.css'

const paths = {
  16: 'M11.5 13a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5h2a.5.5 0 0 0 0-1h-2A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13zM7.646 8.354a.5.5 0 0 0 .708 0L12 4.707V7.5a.5.5 0 0 0 1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0 0 1h2.793L7.646 7.646a.5.5 0 0 0 0 .708',
  24: 'M9.5 6a.5.5 0 0 1 0 1h-2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6zm8 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V7.707l-4.146 4.147a.5.5 0 1 1-.707-.707L16.293 7H12.5a.5.5 0 0 1 0-1z',
}

export const NewTabIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--new-tab', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
