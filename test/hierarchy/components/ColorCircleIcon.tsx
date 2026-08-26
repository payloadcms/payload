'use client'

import React from 'react'

export type ColorCircleIconProps = {
  color?: string
}

export const ColorCircleIcon: React.FC<ColorCircleIconProps> = ({ color = '#888888' }) => {
  return (
    <svg height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" fill={color} r="8" />
    </svg>
  )
}
