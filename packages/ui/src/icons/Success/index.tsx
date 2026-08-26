import React from 'react'

import './index.css'

const paths = {
  26: {
    circle:
      'M13 21C17.4183 21 21 17.4183 21 13C21 8.58172 17.4183 5 13 5C8.58172 5 5 8.58172 5 13C5 17.4183 8.58172 21 13 21Z',
    symbol: 'M10.6001 13.0004L12.2001 14.6004L15.4001 11.4004',
  },
}

export const SuccessIcon: React.FC<{
  readonly className?: string
  readonly size?: 26
}> = ({ className, size = 26 }) => (
  <svg
    className={['icon', 'icon--success', className].filter(Boolean).join(' ')}
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
