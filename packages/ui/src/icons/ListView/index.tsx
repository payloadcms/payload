import React from 'react'

import './index.css'

// Path data from Figma Component Library
const paths = {
  // From Figma - 6x8 icon centered in 16x16 viewbox
  16: 'M11 11.5C11 11.7761 10.7761 12 10.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H10.5C10.7761 11 11 11.2239 11 11.5ZM11 8C11 8.27614 10.7761 8.5 10.5 8.5H5.5C5.22386 8.5 5 8.27614 5 8C5 7.72386 5.22386 7.5 5.5 7.5H10.5C10.7761 7.5 11 7.72386 11 8ZM11 4.5C11 4.77614 10.7761 5 10.5 5H5.5C5.22386 5 5 4.77614 5 4.5C5 4.22386 5.22386 4 5.5 4H10.5C10.7761 4 11 4.22386 11 4.5Z',
  // From Figma - 14x9 icon centered in 24x24 viewbox
  24: 'M18.5 15.5C18.7761 15.5 19 15.7239 19 16C19 16.2761 18.7761 16.5 18.5 16.5H5.5C5.22386 16.5 5 16.2761 5 16C5 15.7239 5.22386 15.5 5.5 15.5H18.5ZM18.5 11.5C18.7761 11.5 19 11.7239 19 12C19 12.2761 18.7761 12.5 18.5 12.5H5.5C5.22386 12.5 5 12.2761 5 12C5 11.7239 5.22386 11.5 5.5 11.5H18.5ZM18.5 7.5C18.7761 7.5 19 7.72386 19 8C19 8.27614 18.7761 8.5 18.5 8.5H5.5C5.22386 8.5 5 8.27614 5 8C5 7.72386 5.22386 7.5 5.5 7.5H18.5Z',
}

export type ListViewIconProps = {
  className?: string
  color?: 'dark' | 'default' | 'muted'
  size?: 16 | 24
}

export function ListViewIcon({ className, color, size = 24 }: ListViewIconProps) {
  const colorClass = color ? `icon--list-view--${color}` : ''

  return (
    <svg
      className={[className, 'icon icon--list-view', colorClass].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
