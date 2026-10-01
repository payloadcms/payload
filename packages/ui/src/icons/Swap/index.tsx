import React from 'react'

import './index.css'

export const SwapIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--swap', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M14.647 12.646a.5.5 0 0 1 .707 0l2.5 2.5a.5.5 0 0 1 0 .707l-2.5 2.5a.5.5 0 0 1-.707-.707L16.293 16H6.5a.5.5 0 0 1 0-1h9.793l-1.646-1.646a.5.5 0 0 1 0-.708m-6-7a.5.5 0 1 1 .707.707L7.707 8H17.5a.5.5 0 0 1 0 1H7.707l1.647 1.646a.5.5 0 0 1-.708.707l-2.5-2.5a.5.5 0 0 1 0-.707z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
