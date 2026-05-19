'use client'
import React from 'react'

const paths = {
  16: 'M7 4h4.5a.5.5 0 0 1 .5.5V6H7zM6 4H4.5a.5.5 0 0 0-.5.5V6h2zm0 3H4v2h2zm0 3H4v1.5a.5.5 0 0 0 .5.5H6zm1 2h4.5a.5.5 0 0 0 .5-.5V10H7zm0-3V7h5v2zM3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5z',
  24: 'M17.204 6.51A2 2 0 0 1 19 8.5V16l-.011.204a2 2 0 0 1-1.785 1.785L17 18H7l-.204-.01a2 2 0 0 1-1.786-1.786L5 16V8.5a2 2 0 0 1 1.796-1.99L7 6.5h10zM6 16a1 1 0 0 0 1 1h2v-2.5H6zm4-1.5V17h7a1 1 0 0 0 .995-.898L18 16v-1.5zm-4-1h3V11H6zm4-2.5v2.5h8V11zM7 7.5a1 1 0 0 0-.995.897L6 8.5V10h3V7.5zm3 2.5h8V8.5a1 1 0 0 0-1-1h-7z',
}

export const TableIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
