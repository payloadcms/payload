import React from 'react'

import './index.css'

const paths = {
  // 16px spinner (sm) - from @figma/fpl-icons Icon16Spinner
  sm: 'M10.778 3.842a5 5 0 0 0-2.279-.817A.54.54 0 0 1 8 2.5a.47.47 0 0 1 .5-.48A6 6 0 1 1 2.02 8.5.47.47 0 0 1 2.5 8c.276 0 .497.224.525.499a5 5 0 1 0 7.753-4.657',
  // 24px spinner (md) - from @figma/fpl-icons Icon24Spinner
  md: 'M15.333 7.011a6 6 0 0 0-2.834-.99A.534.534 0 0 1 12 5.5c0-.276.224-.502.5-.482A7 7 0 1 1 5.018 12.5.473.473 0 0 1 5.5 12c.276 0 .498.224.52.5a6 6 0 1 0 9.313-5.489',
  // 24px spinner large (lg) - from @figma/fpl-icons Icon24SpinnerLarge
  lg: 'M16.445 5.348A8 8 0 0 0 12.5 4.016.525.525 0 0 1 12 3.5a.48.48 0 0 1 .5-.486A9 9 0 1 1 3.014 12.5.48.48 0 0 1 3.5 12c.276 0 .498.224.516.5a8 8 0 1 0 12.429-7.152',
}

const sizes = {
  lg: 24,
  md: 24,
  sm: 16,
}

export type SpinnerIconProps = {
  readonly className?: string
  readonly size?: 'lg' | 'md' | 'sm'
}

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({ className, size = 'sm' }) => {
  const dimension = sizes[size]

  return (
    <svg
      className={['icon icon--spinner', className].filter(Boolean).join(' ')}
      fill="none"
      height={dimension}
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={dimension}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
