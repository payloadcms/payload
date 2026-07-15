import React from 'react'

import './index.css'

const paths = {
  // icon-16-people
  16: 'M6 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0m3 5a1 1 0 1 1 2 0v2.5a.5.5 0 0 0 1 0V10a2 2 0 1 0-4 0v2.5a.5.5 0 0 0 1 0zM5 9a1 1 0 0 0-1 1v2.5a.5.5 0 0 1-1 0V10a2 2 0 1 1 4 0v2.5a.5.5 0 0 1-1 0V10a1 1 0 0 0-1-1m7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0m1 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  // icon-24-people-small
  24: 'M10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0m4.5 4.5a2.5 2.5 0 0 0-2.5 2.5c0-.686-.153-1.336-.428-1.918A3.5 3.5 0 0 1 19 15.5v2a.5.5 0 0 1-1 0v-2a2.5 2.5 0 0 0-2.5-2.5m-7 0A2.5 2.5 0 0 0 6 15.5v2a.5.5 0 0 1-1 0v-2a3.5 3.5 0 1 1 7 0v2a.5.5 0 0 1-1 0v-2A2.5 2.5 0 0 0 8.5 13M17 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0',
}

export const PeopleIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--people', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
