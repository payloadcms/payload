'use client'

import React from 'react'

export const Pill: React.FC<{
  backgroundColor: string
  color: string
  label: string
}> = (props) => {
  const { backgroundColor, color, label } = props

  return (
    <div
      style={{
        backgroundColor,
        borderRadius: '2px',
        color,
        flexShrink: 0,
        lineHeight: 1,
        marginRight: '10px',
        padding: '4px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      <small>{label}</small>
    </div>
  )
}
