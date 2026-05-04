import React from 'react'

import './index.css'

const paths = {
  16: 'M10.776 8H5.224l-.025.005A.25.25 0 0 0 5 8.25v3.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.199-.245zM7 7H6V6a2 2 0 1 1 4 0v1zM5 6a3 3 0 0 1 6 0v1.025c.57.116 1 .62 1 1.225v3.5c0 .69-.56 1.25-1.25 1.25h-5.5C4.56 13 4 12.44 4 11.75v-3.5c0-.605.43-1.11 1-1.225z',
  24: 'M9 8a3 3 0 1 1 6 0v2H9zm-1 2V8a4 4 0 1 1 8 0v2h.125C17.16 10 18 10.84 18 11.875v5.25C18 18.16 17.16 19 16.125 19h-8.25A1.875 1.875 0 0 1 6 17.125v-5.25C6 10.839 6.84 10 7.875 10zm-1 1.875c0-.483.392-.875.875-.875h8.25c.483 0 .875.392.875.875v5.25a.875.875 0 0 1-.875.875h-8.25A.875.875 0 0 1 7 17.125z',
}

export const LockIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--lock', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
