import React from 'react'

import './index.scss'

const Chevron: React.FC<{ className?: string; direction?: 'left' | 'right' }> = ({
  className,
  direction,
}) => (
  <svg
    className={['icon icon--chevron', className].filter(Boolean).join(' ')}
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    style={{
      transform:
        direction === 'left'
          ? 'rotate(90deg)'
          : direction === 'right'
          ? 'rotate(-90deg)'
          : undefined,
    }}
  >
    <path className="stroke" d="M9 10.5L12.5 14.5L16 10.5" />
  </svg>
)

export default Chevron
