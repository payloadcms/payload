import React from 'react'

import './index.scss'

export const ChevronIcon: React.FC<{
  readonly ariaLabel?: string
  readonly className?: string
  readonly direction?: 'down' | 'left' | 'right' | 'up'
  readonly size?: 'large' | 'small'
}> = ({ ariaLabel, className, direction, size }) => (
  <svg
    aria-label={ariaLabel}
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
    viewBox="0 0 20 20"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M14 8L10 12L6 8" strokeLinecap="square" />
  </svg>
)
