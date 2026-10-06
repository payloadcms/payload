import React from 'react'

import './index.css'

const paths = {
  24: 'M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 11C12.2761 11 12.5 11.2239 12.5 11.5V15C12.5 15.2761 12.2761 15.5 12 15.5C11.7239 15.5 11.5 15.2761 11.5 15V11.5C11.5 11.2239 11.7239 11 12 11ZM12 8.5C12.4142 8.5 12.75 8.83579 12.75 9.25C12.75 9.66421 12.4142 10 12 10C11.5858 10 11.25 9.66421 11.25 9.25C11.25 8.83579 11.5858 8.5 12 8.5Z',
}

export const InfoIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--info', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={paths[size]} fill="currentColor" />
  </svg>
)
