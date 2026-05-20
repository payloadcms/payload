import React from 'react'

import './index.css'

const paths = {
  24: 'M17.6533 7.00781C18.4097 7.08461 19 7.72334 19 8.5V15.5C19 16.2767 18.4097 16.9154 17.6533 16.9922L17.5 17H6.5C5.72334 17 5.08461 16.4097 5.00781 15.6533L5 15.5V8.5C5 7.67157 5.67157 7 6.5 7H17.5L17.6533 7.00781ZM6.5 8C6.22386 8 6 8.22386 6 8.5V15.5C6 15.7761 6.22386 16 6.5 16H9V8H6.5ZM10 16H17.5C17.7761 16 18 15.7761 18 15.5V8.5C18 8.22386 17.7761 8 17.5 8H10V16Z',
}

export const SidebarIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--sidebar', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
