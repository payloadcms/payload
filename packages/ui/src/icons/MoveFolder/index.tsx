import React from 'react'

import './index.css'

const paths = {
  // Move folder icon - folder with arrow pointing right
  16: 'M3 5a1 1 0 0 1 1-1h2.618a1 1 0 0 1 .894.553L8.118 6H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5zm1 0v7h8V7H7.882a1 1 0 0 1-.894-.553L6.382 5H4zm-.5 3.5a.5.5 0 0 1 .5-.5h4.293L7.146 6.854a.5.5 0 1 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L8.293 9H4a.5.5 0 0 1-.5-.5',
  24: 'M5 7a1 1 0 0 1 1-1h3.236a1 1 0 0 1 .894.553L10.882 8H18a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7zm1 0v10h12V9h-7.118a1 1 0 0 1-.894-.553L9.236 7H6zm-.5 5.5a.5.5 0 0 1 .5-.5h5.293l-1.647-1.646a.5.5 0 0 1 .708-.708l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708L11.293 13H6a.5.5 0 0 1-.5-.5',
}

export function MoveFolderIcon({
  className,
  size = 24,
}: {
  readonly className?: string
  readonly size?: 16 | 24
}) {
  return (
    <svg
      className={['icon', 'icon--move-folder', className].filter(Boolean).join(' ')}
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
