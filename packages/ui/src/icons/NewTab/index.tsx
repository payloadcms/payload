import React from 'react'

import './index.scss'

export const NewTabIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[className, 'icon icon--new-tab'].filter(Boolean).join(' ')}
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="stroke"
      d="M13 3H17V7M17 3L11 9M5 3C4 3 3 4 3 5V15C3 16 4 17 5 17H15C16 17 17 16 17 15V11"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth="1"
    />
  </svg>
)
