import React from 'react'

import './index.scss'

export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={['icon icon--lock', className].filter(Boolean).join(' ')}
    fill="none"
    height="20"
    viewBox="0 0 20 20"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="stroke"
      d="M7.5 9.5V7.5C7.5 6.83696 7.76339 6.20107 8.23223 5.73223C8.70107 5.26339 9.33696 5 10 5C10.663 5 11.2989 5.26339 11.7678 5.73223C12.2366 6.20107 12.5 6.83696 12.5 7.5V9.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="1"
    />
    <path
      className="stroke"
      d="M13.5 9.5H6.5C5.94772 9.5 5.5 9.94772 5.5 10.5V14C5.5 14.5523 5.94772 15 6.5 15H13.5C14.0523 15 14.5 14.5523 14.5 14V10.5C14.5 9.94772 14.0523 9.5 13.5 9.5Z"
      stopOpacity="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
