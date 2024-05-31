import React from 'react'

import './index.scss'

export const ChevronIcon: React.FC<{
  className?: string
  direction?: 'down' | 'left' | 'right' | 'up'
  size?: 'large' | 'small'
}> = ({ className, direction, size }) => (
  <svg
    className={['icon icon--chevron', className, size && `icon--size-${size}`]
      .filter(Boolean)
      .join(' ')}
    height="100%"
    style={{
      transform:
        direction === 'left'
          ? 'rotate(90deg)'
          : direction === 'right'
            ? 'rotate(-90deg)'
            : direction === 'up'
              ? 'rotate(180deg)'
              : undefined,
    }}
    viewBox="0 0 9 7"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M1.42871 1.5332L4.42707 4.96177L7.42543 1.5332" />
  </svg>
)
