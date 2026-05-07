import React from 'react'

import './index.css'

const paths = {
  16: 'M12.277 3.584a.5.5 0 0 1 .139.693l-5 7.5a.5.5 0 0 1-.77.077l-3-3a.5.5 0 0 1 .708-.708l2.568 2.57 4.662-6.993a.5.5 0 0 1 .693-.139',
  24: 'M16.277 7.584a.5.5 0 0 1 .139.693l-5 7.5a.5.5 0 0 1-.77.076l-3-3a.5.5 0 0 1 .708-.707l2.568 2.569 4.662-6.993a.5.5 0 0 1 .693-.138',
}

export const CheckIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--check', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
