import React from 'react'

import './index.css'

const paths = {
  16: 'M10.778 3.842a5 5 0 0 0-2.279-.817A.54.54 0 0 1 8 2.5a.47.47 0 0 1 .5-.48A6 6 0 1 1 2.02 8.5.47.47 0 0 1 2.5 8c.276 0 .497.224.525.499a5 5 0 1 0 7.753-4.657',
  24: 'M15.333 7.011a6 6 0 0 0-2.834-.99A.534.534 0 0 1 12 5.5c0-.276.224-.502.5-.482A7 7 0 1 1 5.018 12.5.473.473 0 0 1 5.5 12c.276 0 .498.224.52.5a6 6 0 1 0 9.313-5.489',
}

export type SpinnerIconProps = {
  readonly className?: string
  readonly size?: 16 | 24
}

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({ className, size = 16 }) => {
  return (
    <svg
      className={['icon icon--spinner', className].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
