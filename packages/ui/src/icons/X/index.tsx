import React from 'react'

import './index.scss'

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[className, 'icon icon--x'].filter(Boolean).join(' ')}
    height={20}
    viewBox="0 0 20 20"
    width={20}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M14 6L6 14M6 6L14 14" strokeLinecap="square" />
  </svg>
)
