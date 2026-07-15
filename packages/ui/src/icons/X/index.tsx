import React from 'react'

import './index.css'

const paths = {
  // icon-16-close from Figma
  16: 'M11.146 4.146a.5.5 0 0 1 .707.707L8.708 8l3.146 3.146a.5.5 0 0 1-.707.707L8 8.708l-3.147 3.146a.5.5 0 0 1-.707-.707L7.293 8 4.146 4.853a.5.5 0 1 1 .707-.707L8 7.293z',
  // icon-24-close from Figma
  24: 'M16.854 7.146a.5.5 0 0 1 0 .707L12.707 12l4.147 4.146a.5.5 0 0 1-.708.707L12 12.708l-4.146 4.147a.5.5 0 1 1-.708-.708L11.293 12 7.146 7.854a.5.5 0 0 1 .708-.708L12 11.293l4.146-4.147a.5.5 0 0 1 .708 0',
}

export const XIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={[className, 'icon icon--x'].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
