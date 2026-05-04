import React from 'react'

import './index.css'

type Direction = 'down' | 'up'

const paths = {
  // icon-16-arrow-up
  16: 'M8 12a.5.5 0 0 1-.5-.5V4.707L4.354 7.854a.5.5 0 1 1-.708-.707l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.707L8.5 4.707V11.5a.5.5 0 0 1-.5.5',
  // icon-24-arrow-up-small
  24: 'M12 16a.5.5 0 0 1-.5-.5V8.707l-3.146 3.147a.5.5 0 0 1-.708-.708l4-4a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1-.708.708L12.5 8.707V15.5a.5.5 0 0 1-.5.5',
}

export const ArrowIcon: React.FC<{
  readonly className?: string
  readonly direction?: Direction
  readonly size?: 16 | 24
}> = ({ className, direction = 'up', size = 24 }) => (
  <svg
    className={['icon', 'icon--arrow', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    style={{
      transform: direction === 'down' ? 'rotate(180deg)' : undefined,
    }}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
