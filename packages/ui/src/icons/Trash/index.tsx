import React from 'react'

import './index.scss'

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={[className, 'icon icon--trash'].filter(Boolean).join(' ')}
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.1499 6.1H15.8499M14.5499 6.1V15.2C14.5499 15.85 13.8999 16.5 13.2499 16.5H6.7499C6.0999 16.5 5.4499 15.85 5.4499 15.2V6.1M7.3999 6.1V4.8C7.3999 4.15 8.0499 3.5 8.6999 3.5H11.2999C11.9499 3.5 12.5999 4.15 12.5999 4.8V6.1M8.6999 9.35V13.25M11.2999 9.35V13.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
