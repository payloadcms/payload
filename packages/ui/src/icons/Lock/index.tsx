import React from 'react'

import './index.css'

const paths = {
  16: 'M10.776 8H5.224l-.025.005A.25.25 0 0 0 5 8.25v3.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.199-.245zM7 7H6V6a2 2 0 1 1 4 0v1zM5 6a3 3 0 0 1 6 0v1.025c.57.116 1 .62 1 1.225v3.5c0 .69-.56 1.25-1.25 1.25h-5.5C4.56 13 4 12.44 4 11.75v-3.5c0-.605.43-1.11 1-1.225z',
  24: 'M12 6C13.6569 6 15 7.34315 15 9V11H15.5C16.3284 11 17 11.6716 17 12.5V16.5C17 17.3284 16.3284 18 15.5 18H8.5C7.67157 18 7 17.3284 7 16.5V12.5C7 11.6716 7.67157 11 8.5 11H9V9C9 7.34315 10.3431 6 12 6ZM8.5 12C8.22386 12 8 12.2239 8 12.5V16.5C8 16.7761 8.22386 17 8.5 17H15.5C15.7761 17 16 16.7761 16 16.5V12.5C16 12.2239 15.7761 12 15.5 12H8.5ZM12 7C10.8954 7 10 7.89543 10 9V11H14V9C14 7.89543 13.1046 7 12 7Z',
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
