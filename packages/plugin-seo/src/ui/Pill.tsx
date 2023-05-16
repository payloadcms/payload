'use client'

import React from 'react'

export const Pill: React.FC<{
  backgroundColor: string
  color: string
  label: string
}> = props => {
  const { backgroundColor, color, label } = props

  return (
    <div
      style={{
        padding: '4px 6px',
        backgroundColor,
        color,
        borderRadius: '2px',
        marginRight: '10px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <small>{label}</small>
    </div>
  )
}
