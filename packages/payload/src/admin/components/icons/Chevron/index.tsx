import React from 'react'

import './index.scss'

const Chevron: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={['icon icon--chevron', className].filter(Boolean).join(' ')}
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="stroke" d="M9 10.5L12.5 14.5L16 10.5" />
  </svg>
)

export default Chevron
