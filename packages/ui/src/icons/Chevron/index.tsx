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
    height={20}
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
    viewBox="0 0 20 20"
    width={20}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M6 8L10 12.5L14 8" strokeLinecap="square" />
  </svg>
)
