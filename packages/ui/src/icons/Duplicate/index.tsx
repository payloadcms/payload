import React from 'react'

import './index.css'

const paths = {
  // icon-16-duplicate
  16: 'M4 4h5v2H7a1 1 0 0 0-1 1v2H4zm8 2h-2V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2v2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1m0 1H7v5h5zm-2 1.5a.5.5 0 0 0-1 0V9h-.5a.5.5 0 0 0 0 1H9v.5a.5.5 0 0 0 1 0V10h.5a.5.5 0 0 0 0-1H10z',
  // icon-24-duplicate-small
  24: 'M7.5 7h6a.5.5 0 0 1 .5.5V9h-3.5A1.5 1.5 0 0 0 9 10.5V14H7.5a.5.5 0 0 1-.5-.5v-6a.5.5 0 0 1 .5-.5m9 2H15V7.5A1.5 1.5 0 0 0 13.5 6h-6A1.5 1.5 0 0 0 6 7.5v6A1.5 1.5 0 0 0 7.5 15H9v1.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 16.5 9m-6 1a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5zm3.5 2a.5.5 0 0 0-1 0v1h-1a.5.5 0 0 0 0 1h1v1a.5.5 0 0 0 1 0v-1h1a.5.5 0 0 0 0-1h-1z',
}

export const DuplicateIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--duplicate', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
