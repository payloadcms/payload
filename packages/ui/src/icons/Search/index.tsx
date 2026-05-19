import React from 'react'

import './index.css'

const paths: Record<24, string> = {
  24: 'M10.5 5C13.5376 5 16 7.46243 16 10.5C16 11.8512 15.5115 13.0875 14.7031 14.0449C14.7574 14.0691 14.8089 14.1019 14.8535 14.1465L17.8535 17.1465C18.0488 17.3417 18.0488 17.6583 17.8535 17.8535C17.6582 18.0486 17.3417 18.0487 17.1465 17.8535L14.1465 14.8535C14.102 14.809 14.0691 14.7574 14.0449 14.7031C13.0875 15.5115 11.8512 16 10.5 16C7.46243 16 5 13.5376 5 10.5C5 7.46243 7.46243 5 10.5 5ZM10.5 6C8.01472 6 6 8.01472 6 10.5C6 12.9853 8.01472 15 10.5 15C12.9853 15 15 12.9853 15 10.5C15 8.01472 12.9853 6 10.5 6Z',
}

export type SearchIconProps = {
  readonly className?: string
  readonly size?: 24
}

export const SearchIcon: React.FC<SearchIconProps> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--search', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={paths[size]} fill="currentColor" />
  </svg>
)
