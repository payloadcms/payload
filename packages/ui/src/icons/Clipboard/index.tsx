import React from 'react'

import './index.css'

export const ClipboardIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--clipboard', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M10 6h4v1h-4zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1 2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1 1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1m1 3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
