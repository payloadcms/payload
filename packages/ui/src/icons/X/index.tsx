import React from 'react'

import './index.scss'

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[className, 'icon icon--x'].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M7 7L17 17M17 7L7 17" strokeLinecap="round" />
  </svg>
)
