import React from 'react'

import './index.scss'

export function ThreeDotsIcon({ className = '' }) {
  return (
    <div className={`icon icon--dots ${className}`.trim()}>
      <div />
      <div />
      <div />
    </div>
  )
}
