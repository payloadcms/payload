import React from 'react'

import './index.css'

type Props = {
  readonly className?: string
  readonly size?: 16 | 24
}

const paths = {
  16: 'M5.5 13a.5.5 0 0 0 .5-.5v-1q-.001-.033-.007-.065a1.998 1.998 0 0 0 0-3.872Q6 7.533 6 7.5v-4a.5.5 0 0 0-1 0v4q0 .033.006.063a2 2 0 0 0 0 3.872Q5 11.468 5 11.5v1a.5.5 0 0 0 .5.5m5 0a.5.5 0 0 0 .5-.5v-4q-.001-.033-.007-.063a1.998 1.998 0 0 0 0-3.872Q11 4.532 11 4.5v-1a.5.5 0 0 0-1 0v1q0 .033.006.064a1.998 1.998 0 0 0 0 3.873Q10 8.467 10 8.5v4a.5.5 0 0 0 .5.5m0-5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2m-5 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2',
  24: 'M8.5 18a.5.5 0 0 0 .5-.5v-1.55a2.5 2.5 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v4.55a2.501 2.501 0 0 0 0 4.9v1.55a.5.5 0 0 0 .5.5m7 0a.5.5 0 0 0 .5-.5v-4.55a2.501 2.501 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v1.55a2.5 2.5 0 0 0 0 4.9v4.55a.5.5 0 0 0 .5.5m0-6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m-7 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3',
}

export const FilterIcon: React.FC<Props> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--filter', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={paths[size]} fill="currentColor" />
  </svg>
)
