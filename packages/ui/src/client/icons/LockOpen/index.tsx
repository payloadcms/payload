import React from 'react'

import './index.css'

const paths = {
  16: 'M5 5a3 3 0 0 1 6 0v2.025c.57.116 1 .62 1 1.225v3.5c0 .69-.56 1.25-1.25 1.25h-5.5C4.56 13 4 12.44 4 11.75v-3.5C4 7.56 4.56 7 5.25 7H10V5a2 2 0 1 0-4 0 .5.5 0 0 1-1 0m.25 3a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25z',
  24: 'M9 7a3 3 0 1 1 6 0v.5a.5.5 0 0 0 1 0V7a4 4 0 0 0-8 0v3h-.125C6.839 10 6 10.84 6 11.875v5.25C6 18.16 6.84 19 7.875 19h8.25C17.16 19 18 18.16 18 17.125v-5.25C18 10.839 17.16 10 16.125 10H9zm-2 4.875c0-.483.392-.875.875-.875h8.25c.483 0 .875.392.875.875v5.25a.875.875 0 0 1-.875.875h-8.25A.875.875 0 0 1 7 17.125z',
}

export const LockOpenIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--lock-open', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="fill" clipRule="evenodd" d={paths[size]} fillRule="evenodd" />
  </svg>
)
