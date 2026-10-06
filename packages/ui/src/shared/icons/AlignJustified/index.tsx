import React from 'react'

import './index.css'

const paths = {
  16: 'M5 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 8m6 3.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5',
  24: 'M18.5 15C18.7761 15 19 15.2239 19 15.5C19 15.7761 18.7761 16 18.5 16H5.5C5.22386 16 5 15.7761 5 15.5C5 15.2239 5.22386 15 5.5 15H18.5ZM18.5 11C18.7761 11 19 11.2239 19 11.5C19 11.7761 18.7761 12 18.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H18.5ZM18.5 7C18.7761 7 19 7.22386 19 7.5C19 7.77614 18.7761 8 18.5 8H5.5C5.22386 8 5 7.77614 5 7.5C5 7.22386 5.22386 7 5.5 7H18.5Z',
}

export const AlignJustifiedIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--align-justified', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
