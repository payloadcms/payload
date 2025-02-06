import React from 'react'

import './index.scss'

export const Dots: React.FC<{ ariaLabel?: string; className?: string }> = ({
  ariaLabel,
  className,
}) => (
  <div
    aria-label={ariaLabel}
    className={[className && className, 'dots'].filter(Boolean).join(' ')}
  >
    <div />
    <div />
    <div />
  </div>
)
