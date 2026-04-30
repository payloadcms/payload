import React from 'react'

import './index.css'

export const CircledXIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[className, 'icon icon--circled-x'].filter(Boolean).join(' ')}
    fill="none"
    height={16}
    viewBox="4 4 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="stroke" cx="12" cy="12" r="7.5" strokeWidth="1" />
    <path
      className="stroke"
      d="M9.5 9.5L14.5 14.5M14.5 9.5L9.5 14.5"
      strokeLinecap="round"
      strokeWidth="1"
    />
  </svg>
)
