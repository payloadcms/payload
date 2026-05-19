import React from 'react'

import './index.css'

const paths = {
  26: {
    circle:
      'M13 21C17.4183 21 21 17.4183 21 13C21 8.58172 17.4183 5 13 5C8.58172 5 5 8.58172 5 13C5 17.4183 8.58172 21 13 21Z',
    symbol: 'M13 10V13.2M13 16.4H13.008',
  },
}

export const WarningIcon: React.FC<{
  readonly className?: string
  readonly size?: 26
}> = ({ className, size = 26 }) => (
  <svg
    className={['icon', 'icon--warning', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="icon__circle" d={paths[size].circle} />
    <path
      className="icon__symbol"
      d={paths[size].symbol}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
