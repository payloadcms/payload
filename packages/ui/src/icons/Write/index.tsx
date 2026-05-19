import React from 'react'

import './index.css'

export const WriteIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--write', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M9.28 13.017c-.394 1.016.61 2.015 1.625 1.615l1.688-.666a1.5 1.5 0 0 0 .51-.335l3.743-3.742.707-.707a1.5 1.5 0 0 0 0-2.121l-.707-.708a1.5 1.5 0 0 0-2.122 0l-.707.708-3.74 3.74a1.5 1.5 0 0 0-.338.518zm1.258.684a.25.25 0 0 1-.325-.323l.659-1.698a.5.5 0 0 1 .112-.172l3.387-3.387 1.414 1.414-3.389 3.389a.5.5 0 0 1-.17.112zm5.954-4.873-1.414-1.414.354-.353a.5.5 0 0 1 .707 0l.707.707a.5.5 0 0 1 0 .707zM11.5 6a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 1 0v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
