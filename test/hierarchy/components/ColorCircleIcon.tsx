'use client'

import React from 'react'

export type ColorCircleIconProps = {
  color?: string
}

export const ColorCircleIcon: React.FC<ColorCircleIconProps> = ({ color = '#888888' }) => {
  return (
    <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" fill={color} r="8" />
    </svg>
  )
}
