import React from 'react'

import './index.scss'

export const Dots: React.FC<{ className?: string }> = ({ className }) => (
  <div className={[className && className, 'dots'].filter(Boolean).join(' ')}>
    <div />
    <div />
    <div />
  </div>
)
