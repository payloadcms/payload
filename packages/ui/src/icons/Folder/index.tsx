import React from 'react'

import './index.scss'

// Path data from Figma fpl/icons/src/icons/
const paths = {
  // icon-16-folder.tsx
  16: 'M6.586 3a1.5 1.5 0 0 1 1.06.44L9.207 5H11.5A1.5 1.5 0 0 1 13 6.5v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3zM4.5 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5H8.793L6.939 4.146A.5.5 0 0 0 6.586 4zm6 6a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1z',
  // icon-24-folder.tsx
  24: 'M10.586 6a1.5 1.5 0 0 1 1.06.44L13.208 8H16.5A1.5 1.5 0 0 1 18 9.5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-9A1.5 1.5 0 0 1 7.5 6zM7.5 7a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-3.707L10.94 7.146A.5.5 0 0 0 10.586 7zm8 8a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1z',
}

export type FolderIconProps = {
  className?: string
  color?: 'dark' | 'default' | 'muted'
  size?: 16 | 24
}

export function FolderIcon({ className, color, size = 24 }: FolderIconProps) {
  const colorClass = color ? `icon--folder--${color}` : ''

  return (
    <svg
      className={[className, 'icon icon--folder', colorClass].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={paths[size]} fill="currentColor" />
    </svg>
  )
}
