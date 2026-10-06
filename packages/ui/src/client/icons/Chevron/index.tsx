import React from 'react'

import './index.css'

type Direction = 'down' | 'left' | 'right' | 'up'

const paths: Record<16 | 24, string> = {
  16: 'M9.76777 6.76764C9.96304 6.57248 10.2796 6.57241 10.4748 6.76764C10.67 6.96288 10.6699 7.27943 10.4748 7.47467L8.35371 9.59577C8.15847 9.79101 7.84194 9.79096 7.64668 9.59577L5.52461 7.47467C5.32969 7.27948 5.32969 6.96284 5.52461 6.76764C5.71988 6.57248 6.03738 6.57241 6.23261 6.76764L8.00019 8.53522L9.76777 6.76764Z',
  24: 'M8.35352 10.1465C8.15825 9.9512 7.84175 9.9512 7.64648 10.1465C7.45122 10.3417 7.45122 10.6583 7.64648 10.8535L11.6465 14.8535C11.8417 15.0488 12.1583 15.0488 12.3535 14.8535L16.3535 10.8535C16.5488 10.6583 16.5488 10.3417 16.3535 10.1465C16.1583 9.9512 15.8417 9.9512 15.6465 10.1465L12 13.793L8.35352 10.1465Z',
}

const rotations: Record<Direction, number> = {
  down: 0,
  left: 90,
  right: -90,
  up: 180,
}

export type ChevronIconProps = {
  readonly ariaLabel?: string
  readonly className?: string
  readonly direction?: Direction
  readonly size?: 16 | 24
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({
  ariaLabel,
  className,
  direction = 'down',
  size = 24,
}) => (
  <svg
    aria-label={ariaLabel}
    className={['icon', 'icon--chevron', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    style={{ transform: rotations[direction] ? `rotate(${rotations[direction]}deg)` : undefined }}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="fill" clipRule="evenodd" d={paths[size]} fillRule="evenodd" />
  </svg>
)
