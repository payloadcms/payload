import React from 'react'

import './index.css'

type Direction = 'down' | 'left' | 'right' | 'up'

// Path data from Figma icons - using "down" as base, rotate for other directions
const paths = {
  // 16x16 viewBox - icon-16-chevron-down
  16: 'M10.475 6.768a.5.5 0 0 1 0 .707L8.354 9.596 8 9.95l-.354-.354-2.12-2.121a.5.5 0 0 1 .706-.707L8 8.536l1.768-1.768a.5.5 0 0 1 .707 0',
  // 24x24 viewBox default - icon-24-chevron-down (smaller chevron)
  24: 'M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708',
  // 24x24 viewBox large - icon-24-chevron-down-large (bigger chevron)
  '24-bold':
    'M7.646 10.146a.5.5 0 0 1 .708 0L12 13.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708',
}

const rotations: Record<Direction, number> = {
  down: 0,
  left: 90,
  right: -90,
  up: 180,
}

export const ChevronIcon: React.FC<{
  readonly ariaLabel?: string
  readonly bold?: boolean
  readonly className?: string
  readonly direction?: Direction
  /** @deprecated Use `size={16}` instead. Kept for backward compatibility. */
  readonly size?: 'large' | 'small' | 16 | 24
}> = ({ ariaLabel, bold = false, className, direction = 'down', size = 24 }) => {
  // Handle legacy size prop values
  const numericSize = size === 'small' ? 16 : size === 'large' ? 24 : size
  const pathKey = numericSize === 16 ? 16 : bold ? '24-bold' : 24

  return (
    <svg
      aria-label={ariaLabel}
      className={[
        'icon',
        'icon--chevron',
        className,
        numericSize === 16 && 'icon--chevron-16',
        bold && 'icon--chevron-bold',
      ]
        .filter(Boolean)
        .join(' ')}
      fill="none"
      height={numericSize}
      style={{
        transform: rotations[direction] ? `rotate(${rotations[direction]}deg)` : undefined,
      }}
      viewBox={`0 0 ${numericSize} ${numericSize}`}
      width={numericSize}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path className="fill" clipRule="evenodd" d={paths[pathKey]} fillRule="evenodd" />
    </svg>
  )
}
