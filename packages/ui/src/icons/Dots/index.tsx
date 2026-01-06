import React from 'react'

import './index.scss'

const baseClass = 'dots'

export const Dots: React.FC<{
  ariaLabel?: string
  className?: string
  noBackground?: boolean
  orientation?: 'horizontal' | 'vertical'
}> = ({ ariaLabel, className, noBackground, orientation = 'vertical' }) => (
  <div
    aria-label={ariaLabel}
    className={[
      className,
      baseClass,
      noBackground && `${baseClass}--no-background`,
      orientation && `${baseClass}--${orientation}`,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <div />
    <div />
    <div />
  </div>
)
