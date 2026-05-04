import React from 'react'

import './index.css'

const paths = {
  16: 'M9.87 2.724a1 1 0 0 1 1.337.069l2 2 .068.076a1 1 0 0 1-.068 1.338l-6.5 6.5A1 1 0 0 1 6 13H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707l6.5-6.5zM4 12h2l.646-.647-2-2 .708-.707 2 2 3.292-3.293-2-2L4 10zm8.5-6.5-1.146 1.146-2-2L10.5 3.5z',
  24: 'M4.008 5.124a1 1 0 0 1 1.116-1.116l3.66.457-.124.992-2.636-.329L5 5l.128 1.024.33 2.636a1 1 0 0 0 .285.583l7.403 7.403 3.5-3.5-7.403-7.403a1 1 0 0 0-.583-.286l.124-.992a2 2 0 0 1 1.166.57l9.55 9.55a2 2 0 0 1 0 2.83L17.414 19.5a2 2 0 0 1-2.828 0l-9.55-9.55a2 2 0 0 1-.57-1.166zm13.346 8.73-3.5 3.5 1.439 1.439a1 1 0 0 0 1.414 0l2.086-2.086a1 1 0 0 0 0-1.414z',
}

export const EditIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--edit', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
