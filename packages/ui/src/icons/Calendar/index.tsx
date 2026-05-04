import React from 'react'

import './index.css'

export const CalendarIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--calendar', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 3.5a.5.5 0 0 1 1 0V4h6v-.5a.5.5 0 0 1 1 0V4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zM15 5v.5a.5.5 0 0 0 1 0V5h2a1 1 0 0 1 1 1v2H5V6a1 1 0 0 1 1-1h2v.5a.5.5 0 0 0 1 0V5zM5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
