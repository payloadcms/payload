import React from 'react'

import './index.scss'

export const PlusIcon: React.FC = () => (
  <svg
    className="icon icon--plus"
    viewBox="0 0 19 19"
    width="19"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line className="stroke" x1="9.5" x2="9.5" y1="14" y2="5" />
    <line className="stroke" x1="5" x2="14" y1="9.5" y2="9.5" />
  </svg>
)
