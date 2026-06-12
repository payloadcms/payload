import React from 'react'

import './index.css'

const paths = {
  16: 'M6.285 2.915c.777-1.295 2.653-1.294 3.43 0l4.234 7.056c.8 1.333-.161 3.029-1.716 3.029H3.766c-1.554 0-2.515-1.696-1.716-3.03zm2.572.514a1 1 0 0 0-1.715 0l-4.234 7.056a1 1 0 0 0 .716 1.505l.142.01h8.467a1 1 0 0 0 .857-1.515zM8 9.499A.75.75 0 1 1 8 11a.75.75 0 0 1 0-1.5m.079-4.495a.73.73 0 0 1 .648.787l-.23 2.75a.5.5 0 0 1-.996 0L7.272 5.79A.73.73 0 0 1 8 5z',
  24: 'M10.257 6.06c.764-1.36 2.722-1.36 3.486 0l5.04 8.96c.75 1.333-.213 2.98-1.743 2.98H6.96c-1.53 0-2.493-1.647-1.743-2.98l.87.49a1 1 0 0 0 .733 1.48l.14.01h10.08a1 1 0 0 0 .872-1.49l-.001-.001-5.04-8.96a1 1 0 0 0-1.742 0l-5.041 8.96-.871-.49zM12 14.003a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5M12 8.5c.425 0 .76.36.73.785l-.231 3.25a.5.5 0 0 1-.998 0l-.232-3.25A.733.733 0 0 1 12 8.5',
}

export const WarningIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--warning', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
