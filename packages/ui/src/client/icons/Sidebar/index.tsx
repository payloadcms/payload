import React from 'react'

import './index.css'

const paths = {
  16: {
    height: 12,
    path: 'M14 0C15.1046 0 16 0.895431 16 2V10L15.9893 10.2041C15.887 11.2128 15.0357 12 14 12H2C0.964349 12 0.113005 11.2128 0.0107422 10.2041L0 10V2C1.28853e-07 0.895431 0.895431 0 2 0H14ZM2 1C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H5V1H2ZM14 11C14.5523 11 15 10.5523 15 10V2C15 1.44772 14.5523 1 14 1H6V11H14Z',
    width: 16,
  },
}

export const SidebarIcon: React.FC<{
  readonly className?: string
  readonly size?: 16
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--sidebar', className].filter(Boolean).join(' ')}
    fill="none"
    height={paths[size].height}
    viewBox={`0 0 ${paths[size].width} ${paths[size].height}`}
    width={paths[size].width}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size].path} fill="currentColor" fillRule="evenodd" />
  </svg>
)
