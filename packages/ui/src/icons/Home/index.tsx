import React from 'react'

import './index.css'

const paths = {
  // Home icon from Figma
  16: 'M7.336 2.422a1 1 0 0 1 1.328 0l4 3.555-.332.374.332-.374a1 1 0 0 1 .336.747V12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9H7v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.725a1 1 0 0 1 .336-.748zM8 3.169 4 6.725V12h2V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h2V6.725z',
}

const size = 16

export const HomeIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--home', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
