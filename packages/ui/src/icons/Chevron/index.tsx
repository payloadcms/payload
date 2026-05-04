import React from 'react'

import './index.css'

type Direction = 'down' | 'left' | 'right' | 'up'

const paths = {
  // icon-16-chevron-down - fills the 16x16 viewBox well
  16: 'M10.475 6.768a.5.5 0 0 1 0 .707L8.354 9.596 8 9.95l-.354-.354-2.12-2.121a.5.5 0 0 1 .706-.707L8 8.536l1.768-1.768a.5.5 0 0 1 .707 0',
  // icon-24-chevron-down - smaller chevron, more padding (default for 24px)
  '24-small':
    'M9.646 11.146a.5.5 0 0 1 .708 0L12 12.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708',
  // icon-24-chevron-down-large - larger chevron, less padding
  '24-large':
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
  /** @deprecated Use `large` instead */
  readonly bold?: boolean
  readonly className?: string
  readonly direction?: Direction
  /**
   * Use the larger chevron variant (icon-24-chevron-down-large).
   * Only applies when size is 24. The 16px icon only has one size.
   */
  readonly large?: boolean
  /**
   * Icon dimensions. String values 'large'/'small' are deprecated -
   * use numeric 24/16 instead.
   */
  readonly size?: 'large' | 'small' | 16 | 24
}> = ({ ariaLabel, bold = false, className, direction = 'down', large = false, size = 24 }) => {
  // Map legacy string values: 'small' → 16px, 'large' → 24px
  const numericSize = size === 'small' ? 16 : size === 'large' ? 24 : size

  // Determine which path to use
  // - 16px only has one variant
  // - 24px has small (default) and large variants
  const useLargeVariant = large || bold // bold is deprecated alias for large
  const pathKey = numericSize === 16 ? 16 : useLargeVariant ? '24-large' : '24-small'

  return (
    <svg
      aria-label={ariaLabel}
      className={[
        'icon',
        'icon--chevron',
        className,
        numericSize === 16 && 'icon--chevron-16',
        useLargeVariant && 'icon--chevron-large',
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
