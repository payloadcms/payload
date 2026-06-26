import React from 'react'

import './index.css'

export const ReplaceIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--replace', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M17.854 11.646a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708l2.647-2.646H6.5a.5.5 0 0 1 0-1h9.793l-2.647-2.646a.5.5 0 0 1 .708-.708z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
