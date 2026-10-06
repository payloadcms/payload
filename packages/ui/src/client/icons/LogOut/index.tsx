import React from 'react'

import './index.css'

const paths = {
  // 24px path sourced from Figma icon.24.interaction.enter
  16: 'M9 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9a.5.5 0 0 1 0-1h3V4H9a.5.5 0 0 1 0-1M5.854 5.146a.5.5 0 0 1 0 .708L4.207 7.5H9a.5.5 0 0 1 0 1H4.207l1.647 1.646a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708 0',
  24: 'M7.5 6A1.5 1.5 0 0 0 6 7.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 0-1 0v1A1.5 1.5 0 0 0 7.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 6zm4.146 3.146a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708l1.647-1.646H9.5a.5.5 0 0 1 0-1h3.793l-1.647-1.646a.5.5 0 0 1 0-.708',
}

export const LogOutIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--logout', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
