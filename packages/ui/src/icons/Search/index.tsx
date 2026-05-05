import React from 'react'

import './index.css'

export const SearchIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--search', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.5 5a6.5 6.5 0 0 1 4.935 10.728l3.419 3.419.064.078a.5.5 0 0 1-.693.693l-.079-.064-3.419-3.42A6.5 6.5 0 1 1 11.5 5m0 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11"
      fill="currentColor"
    />
  </svg>
)
