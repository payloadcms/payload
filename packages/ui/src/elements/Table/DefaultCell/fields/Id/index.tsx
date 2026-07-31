'use client'
import React from 'react'

import './index.css'

const baseClass = 'id-cell'

export const IdCell: React.FC<{ id: number | string }> = ({ id }) => {
  return (
    <span className={baseClass}>
      <span className={`${baseClass}__prefix`}>ID</span>
      <span className={`${baseClass}__value`}>{id}</span>
    </span>
  )
}
